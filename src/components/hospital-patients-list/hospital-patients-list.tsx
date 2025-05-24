import { Component, h, State, Event, EventEmitter } from '@stencil/core';
import { Patient, HospitalDataService } from '../../utils/hospital-data';

@Component({
  tag: 'hospital-patients-list',
  styleUrl: 'hospital-patients-list.css',
  shadow: true,
})
export class HospitalPatientsList {
  @State() patients: Patient[] = [];
  @State() filteredPatients: Patient[] = [];
  @State() loading: boolean = true;
  @State() showAddForm: boolean = false;
  @State() newPatient: Partial<Patient> = {};
  @State() searchTerm: string = '';

  @Event() navigate: EventEmitter<{id: string}>;

  async componentWillLoad() {
    await this.loadPatients();
  }

  private async loadPatients() {
    this.loading = true;
    try {
      this.patients = await HospitalDataService.getPatients();
      this.filteredPatients = [...this.patients];
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      this.loading = false;
    }
  }

  private handleSearch(term: string) {
    this.searchTerm = term;
    if (!term.trim()) {
      this.filteredPatients = [...this.patients];
    } else {
      const searchLower = term.toLowerCase();
      this.filteredPatients = this.patients.filter(patient =>
        patient.first_name.toLowerCase().includes(searchLower) ||
        patient.last_name.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower) ||
        patient.phone.includes(term)
      );
    }
  }

  private handlePatientClick(patient: Patient) {
    this.navigate.emit({ id: patient._id });
  }

  private async handleAddPatient() {
    if (!this.newPatient.first_name || !this.newPatient.last_name || !this.newPatient.birth_date) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      await HospitalDataService.createPatient({
        first_name: this.newPatient.first_name,
        last_name: this.newPatient.last_name,
        birth_date: this.newPatient.birth_date,
        age: this.newPatient.age || 0,
        gender: this.newPatient.gender || 'M',
        phone: this.newPatient.phone || '',
        email: this.newPatient.email || '',
        hospitalization_records: []
      });

      this.showAddForm = false;
      this.newPatient = {};
      await this.loadPatients();
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Chyba pri vytváraní pacienta');
    }
  }

  private async handleDeletePatient(patient: Patient, event: Event) {
    event.stopPropagation();

    if (!confirm(`Naozaj chcete vymazať pacienta ${patient.first_name} ${patient.last_name}?`)) {
      return;
    }

    try {
      await HospitalDataService.deletePatient(patient._id);
      await this.loadPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Chyba pri mazaní pacienta');
    }
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('sk-SK');
  }

  private calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  render() {
    if (this.loading) {
      return (
        <div class="container">
          <div class="loading">Načítavam pacientov...</div>
        </div>
      );
    }

    return (
      <div class="container">
        <div class="header">
          <h2>Pacienti nemocnice</h2>
          <button
            class="btn-primary"
            onClick={() => this.showAddForm = true}
          >
            + Pridať pacienta
          </button>
        </div>

        <div class="search-section">
          <div class="search-box">
            <input
              type="text"
              placeholder="Hľadať pacienta (meno, email, telefón)..."
              value={this.searchTerm}
              onInput={(e) => this.handleSearch((e.target as HTMLInputElement).value)}
            />
            <span class="search-icon">🔍</span>
          </div>
          <div class="results-info">
            Zobrazených: {this.filteredPatients.length} z {this.patients.length} pacientov
          </div>
        </div>

        <div class="patients-grid">
          {this.filteredPatients.map(patient => (
            <div
              key={patient._id}
              class="patient-card"
              onClick={() => this.handlePatientClick(patient)}
            >
              <div class="patient-header">
                <div class="patient-name">
                  <h3>{patient.first_name} {patient.last_name}</h3>
                  <span class="age">{patient.age || this.calculateAge(patient.birth_date)} rokov</span>
                </div>
                <div class="patient-actions">
                  <button
                    class="delete-btn"
                    onClick={(e) => this.handleDeletePatient(patient, e)}
                    title="Vymazať pacienta"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div class="patient-info">
                <div class="info-row">
                  <span class="icon">📅</span>
                  <span>Narodený: {this.formatDate(patient.birth_date)}</span>
                </div>
                <div class="info-row">
                  <span class="icon">👤</span>
                  <span>Pohlavie: {patient.gender === 'M' ? 'Muž' : 'Žena'}</span>
                </div>
                {patient.phone && (
                  <div class="info-row">
                    <span class="icon">📞</span>
                    <span>{patient.phone}</span>
                  </div>
                )}
                {patient.email && (
                  <div class="info-row">
                    <span class="icon">📧</span>
                    <span>{patient.email}</span>
                  </div>
                )}
                <div class="info-row">
                  <span class="icon">🏥</span>
                  <span>Hospitalizácií: {patient.hospitalization_records.length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {this.filteredPatients.length === 0 && !this.loading && (
          <div class="no-results">
            {this.searchTerm ? 'Žiadni pacienti nevyhovujú hľadaniu' : 'Žiadni pacienti v systéme'}
          </div>
        )}

        {this.showAddForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Pridať nového pacienta</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showAddForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-row">
                  <div class="form-group">
                    <label>Meno *</label>
                    <input
                      type="text"
                      value={this.newPatient.first_name || ''}
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        first_name: (e.target as HTMLInputElement).value
                      }}
                      placeholder="Zadajte meno"
                    />
                  </div>

                  <div class="form-group">
                    <label>Priezvisko *</label>
                    <input
                      type="text"
                      value={this.newPatient.last_name || ''}
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        last_name: (e.target as HTMLInputElement).value
                      }}
                      placeholder="Zadajte priezvisko"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Dátum narodenia *</label>
                    <input
                      type="date"
                      value={this.newPatient.birth_date || ''}
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        birth_date: (e.target as HTMLInputElement).value
                      }}
                    />
                  </div>

                  <div class="form-group">
                    <label>Vek</label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={this.newPatient.age || ''}
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        age: parseInt((e.target as HTMLInputElement).value) || 0
                      }}
                      placeholder="Zadajte vek"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Pohlavie</label>
                    <select
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        gender: (e.target as HTMLSelectElement).value
                      }}
                    >
                      <option value="M" selected={this.newPatient.gender === 'M'}>Muž</option>
                      <option value="F" selected={this.newPatient.gender === 'F'}>Žena</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Telefón</label>
                  <input
                    type="tel"
                    value={this.newPatient.phone || ''}
                    onInput={(e) => this.newPatient = {
                      ...this.newPatient,
                      phone: (e.target as HTMLInputElement).value
                    }}
                    placeholder="+421..."
                  />
                </div>

                <div class="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={this.newPatient.email || ''}
                    onInput={(e) => this.newPatient = {
                      ...this.newPatient,
                      email: (e.target as HTMLInputElement).value
                    }}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showAddForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleAddPatient()}
                >
                  Pridať pacienta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
