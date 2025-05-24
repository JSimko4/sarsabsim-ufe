import { Component, h, State, Event, EventEmitter, Prop, Watch } from '@stencil/core';
import { HospitalApiService } from '../../utils/hospital-api-service';
import { Patient, PatientGenderEnum } from '../../api/hospital-management';

@Component({
  tag: 'hospital-patients-list',
  styleUrl: 'hospital-patients-list.css',
  shadow: true,
})
export class HospitalPatientsList {
  @Prop() apiBase: string;
  @State() patients: Patient[] = [];
  @State() filteredPatients: Patient[] = [];
  @State() loading: boolean = true;
  @State() showAddForm: boolean = false;
  @State() showDeleteConfirm: boolean = false;
  @State() searchTerm: string = '';
  @State() newPatient: Partial<Patient> = {};
  @State() deletingPatientId: string = '';

  @Event() patientSelected: EventEmitter<string>;

  private hospitalApiService: HospitalApiService;

  componentWillLoad() {
    this.hospitalApiService = new HospitalApiService(this.apiBase);
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      this.patients = await this.hospitalApiService.getPatients();
      this.filteredPatients = [...this.patients];
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      this.loading = false;
    }
  }

  private filterPatients() {
    if (!this.searchTerm.trim()) {
      this.filteredPatients = [...this.patients];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredPatients = this.patients.filter(patient =>
      patient.firstName.toLowerCase().includes(term) ||
      patient.lastName.toLowerCase().includes(term) ||
      patient.email?.toLowerCase().includes(term) ||
      patient.phone?.toLowerCase().includes(term)
    );
  }

  private handlePatientClick(patient: Patient) {
    this.patientSelected.emit(patient.id!);
  }

  private async handleCreatePatient() {
    if (!this.newPatient.firstName || !this.newPatient.lastName || !this.newPatient.birthDate) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      await this.hospitalApiService.createPatient({
        firstName: this.newPatient.firstName,
        lastName: this.newPatient.lastName,
        birthDate: this.newPatient.birthDate,
        age: this.newPatient.age || 0,
        gender: this.newPatient.gender || PatientGenderEnum.M,
        phone: this.newPatient.phone,
        email: this.newPatient.email,
        hospitalizationRecords: []
      });

      this.showAddForm = false;
      this.newPatient = {};
      await this.loadData();
    } catch (error) {
      console.error('Error creating patient:', error);
      alert('Chyba pri vytváraní pacienta');
    }
  }

  private async handleDeletePatient(patient: Patient) {
    if (!confirm(`Naozaj chcete vymazať pacienta ${patient.firstName} ${patient.lastName}?`)) {
      return;
    }

    try {
      await this.hospitalApiService.deletePatient(patient.id!);
      await this.loadData();
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Chyba pri mazaní pacienta');
    }
  }

  private calculateAge(birthDate: Date | string): number {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('sk-SK');
  }

  private getHospitalizationStatus(patient: Patient): string {
    const records = patient.hospitalizationRecords || [];
    return records.length > 0 ? `${records.length} hospitalizácie` : 'Bez hospitalizácie';
  }

  @Watch('searchTerm')
  private handleSearchTermChange() {
    this.filterPatients();
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
              onInput={(e) => this.searchTerm = (e.target as HTMLInputElement).value}
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
              key={patient.id}
              class="patient-card"
              onClick={() => this.handlePatientClick(patient)}
            >
              <div class="patient-header">
                <div class="patient-name">
                  <h3>{patient.firstName} {patient.lastName}</h3>
                  <span class="age">{patient.age || this.calculateAge(patient.birthDate)} rokov</span>
                </div>
                <div class="patient-actions">
                  <button
                    class="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleDeletePatient(patient);
                    }}
                    title="Vymazať pacienta"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div class="patient-info">
                <div class="info-row">
                  <span class="icon">📅</span>
                  <span>Narodený: {this.formatDate(patient.birthDate)}</span>
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
                  <span>Hospitalizácií: {this.getHospitalizationStatus(patient)}</span>
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
                      value={this.newPatient.firstName || ''}
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        firstName: (e.target as HTMLInputElement).value
                      }}
                      placeholder="Krstné meno"
                    />
                  </div>

                  <div class="form-group">
                    <label>Priezvisko *</label>
                    <input
                      type="text"
                      value={this.newPatient.lastName || ''}
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        lastName: (e.target as HTMLInputElement).value
                      }}
                      placeholder="Priezvisko"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Dátum narodenia *</label>
                    <input
                      type="date"
                      value={this.newPatient.birthDate ? (typeof this.newPatient.birthDate === 'string' ? this.newPatient.birthDate : this.newPatient.birthDate.toISOString().split('T')[0]) : ''}
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        birthDate: new Date((e.target as HTMLInputElement).value)
                      }}
                    />
                  </div>

                  <div class="form-group">
                    <label>Pohlavie</label>
                    <select
                      onInput={(e) => this.newPatient = {
                        ...this.newPatient,
                        gender: (e.target as HTMLSelectElement).value as PatientGenderEnum
                      }}
                    >
                      <option value={PatientGenderEnum.M}>Muž</option>
                      <option value={PatientGenderEnum.F}>Žena</option>
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
                  onClick={() => this.handleCreatePatient()}
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

