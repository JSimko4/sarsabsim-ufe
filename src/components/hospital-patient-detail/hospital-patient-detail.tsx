import { Component, h, State, Prop, Event, EventEmitter } from '@stencil/core';
import { Patient, HospitalDataService } from '../../utils/hospital-data';

@Component({
  tag: 'hospital-patient-detail',
  styleUrl: 'hospital-patient-detail.css',
  shadow: true,
})
export class HospitalPatientDetail {
  @Prop() patientId: string;
  @State() patient: Patient | null = null;
  @State() loading: boolean = true;
  @State() showEditForm: boolean = false;
  @State() showAddHospitalizationForm: boolean = false;
  @State() showEditHospitalizationForm: boolean = false;
  @State() editPatient: Partial<Patient> = {};
  @State() newHospitalization: { description: string } = { description: '' };
  @State() editHospitalization: { id: string; description: string } = { id: '', description: '' };

  @Event() back: EventEmitter<void>;

  async componentWillLoad() {
    await this.loadData();
  }

  async componentWillUpdate() {
    if (this.patientId && !this.patient) {
      await this.loadData();
    }
  }

  private async loadData() {
    this.loading = true;
    try {
      this.patient = await HospitalDataService.getPatient(this.patientId);
      if (this.patient) {
        this.editPatient = { ...this.patient };
      }
    } catch (error) {
      console.error('Error loading patient data:', error);
    } finally {
      this.loading = false;
    }
  }

    private handleOpenEditForm() {
    // Jednoducho skopíruj všetky údaje z aktuálneho pacienta
    this.editPatient = {
      first_name: this.patient?.first_name || '',
      last_name: this.patient?.last_name || '',
      birth_date: this.patient?.birth_date || '',
      age: this.patient?.age || 0,
      gender: this.patient?.gender || 'M',
      phone: this.patient?.phone || '',
      email: this.patient?.email || ''
    };
    this.showEditForm = true;
  }

    private async handleUpdatePatient() {
    if (!this.editPatient.first_name?.trim() || !this.editPatient.last_name?.trim()) {
      alert('Prosím vyplňte meno a priezvisko');
      return;
    }

    console.log('UPDATE: Začínam update pacienta');
    console.log('UPDATE: Aktuálny pacient:', this.patient);
    console.log('UPDATE: Edit data:', this.editPatient);

    try {
      // Aktualizuj len tie polia ktoré sa zmenili, zachovaj všetko ostatné
      const updatedData = {
        ...this.patient, // zachovaj všetko staré
        first_name: this.editPatient.first_name.trim(),
        last_name: this.editPatient.last_name.trim(),
        birth_date: this.editPatient.birth_date || this.patient?.birth_date || '',
        age: this.editPatient.age || 0,
        gender: this.editPatient.gender || this.patient?.gender || 'M',
        phone: this.editPatient.phone?.trim() || '',
        email: this.editPatient.email?.trim() || '',
        updated_at: new Date().toISOString()
      };

      console.log('UPDATE: Posielam na server:', updatedData);

      const result = await HospitalDataService.updatePatient(this.patientId, updatedData);

      console.log('UPDATE: Výsledok zo servera:', result);

      if (result) {
        console.log('UPDATE: Aktualizujem stav');
        // Aktualizuj stav
        this.patient = { ...result };
        this.showEditForm = false;

        console.log('UPDATE: Nový stav pacienta:', this.patient);
      } else {
        console.log('UPDATE: Server vrátil null');
        alert('Chyba pri aktualizácii pacienta');
      }
    } catch (error) {
      console.error('UPDATE: Chyba:', error);
      alert('Chyba pri aktualizácii pacienta');
    }
  }

  private async handleAddHospitalization() {
    if (!this.newHospitalization.description.trim()) {
      alert('Prosím zadajte popis hospitalizácie');
      return;
    }

    try {
      const newRecord = {
        id: 'hosp_' + Date.now(),
        description: this.newHospitalization.description.trim()
      };

      const updatedRecords = [...(this.patient?.hospitalization_records || []), newRecord];

      const updatedPatient = await HospitalDataService.updatePatient(this.patientId, {
        hospitalization_records: updatedRecords
      });

      this.showAddHospitalizationForm = false;
      this.newHospitalization = { description: '' };

      // Update patient state directly
      if (updatedPatient) {
        this.patient = { ...updatedPatient };
        this.editPatient = { ...updatedPatient };
      } else {
        await this.loadData();
      }
    } catch (error) {
      console.error('Error adding hospitalization:', error);
      alert('Chyba pri pridávaní hospitalizácie');
    }
  }

  private handleEditHospitalization(record: { id: string; description: string }) {
    this.editHospitalization = { ...record };
    this.showEditHospitalizationForm = true;
  }

  private async handleUpdateHospitalization() {
    if (!this.editHospitalization.description.trim()) {
      alert('Prosím zadajte popis hospitalizácie');
      return;
    }

    try {
      const updatedRecords = this.patient?.hospitalization_records.map(record =>
        record.id === this.editHospitalization.id
          ? { ...record, description: this.editHospitalization.description.trim() }
          : record
      ) || [];

      const updatedPatient = await HospitalDataService.updatePatient(this.patientId, {
        hospitalization_records: updatedRecords
      });

      this.showEditHospitalizationForm = false;
      this.editHospitalization = { id: '', description: '' };

      // Update patient state directly
      if (updatedPatient) {
        this.patient = { ...updatedPatient };
        this.editPatient = { ...updatedPatient };
      } else {
        await this.loadData();
      }
    } catch (error) {
      console.error('Error updating hospitalization:', error);
      alert('Chyba pri aktualizácii hospitalizácie');
    }
  }

  private async handleDeleteHospitalization(hospitalizationId: string) {
    if (!confirm('Naozaj chcete vymazať tento záznam hospitalizácie?')) {
      return;
    }

    try {
      const updatedRecords = this.patient?.hospitalization_records.filter(
        record => record.id !== hospitalizationId
      ) || [];

      const updatedPatient = await HospitalDataService.updatePatient(this.patientId, {
        hospitalization_records: updatedRecords
      });

      // Update patient state directly
      if (updatedPatient) {
        this.patient = { ...updatedPatient };
        this.editPatient = { ...updatedPatient };
      } else {
        await this.loadData();
      }
    } catch (error) {
      console.error('Error deleting hospitalization:', error);
      alert('Chyba pri mazaní hospitalizácie');
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
          <div class="loading">Načítavam údaje pacienta...</div>
        </div>
      );
    }

    if (!this.patient) {
      return (
        <div class="container">
          <div class="error">Pacient nenájdený</div>
        </div>
      );
    }

    return (
      <div class="container">
        <div class="header">
          <button class="back-btn" onClick={() => this.back.emit()}>
            ← Späť na zoznam
          </button>
          <h2>{this.patient.first_name} {this.patient.last_name}</h2>
          <button
            class="btn-primary"
            onClick={() => this.handleOpenEditForm()}
          >
            ✏️ Upraviť údaje
          </button>
        </div>

        <div class="patient-info">
          <div class="basic-info-card">
            <h3>Základné informácie</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Meno:</span>
                <span class="value">{this.patient.first_name} {this.patient.last_name}</span>
              </div>
              <div class="info-item">
                <span class="label">Vek:</span>
                <span class="value">{this.patient.age || this.calculateAge(this.patient.birth_date)} rokov</span>
              </div>
              <div class="info-item">
                <span class="label">Dátum narodenia:</span>
                <span class="value">{this.formatDate(this.patient.birth_date)}</span>
              </div>
              <div class="info-item">
                <span class="label">Pohlavie:</span>
                <span class="value">{this.patient.gender === 'M' ? 'Muž' : 'Žena'}</span>
              </div>
              <div class="info-item">
                <span class="label">Telefón:</span>
                <span class="value">{this.patient.phone || 'Nezadané'}</span>
              </div>
              <div class="info-item">
                <span class="label">Email:</span>
                <span class="value">{this.patient.email || 'Nezadané'}</span>
              </div>
              <div class="info-item">
                <span class="label">Registrovaný:</span>
                <span class="value">{this.formatDate(this.patient.created_at)}</span>
              </div>
              <div class="info-item">
                <span class="label">Posledná aktualizácia:</span>
                <span class="value">{this.formatDate(this.patient.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hospitalizations-section">
          <div class="section-header">
            <h3>História hospitalizácií</h3>
            <button
              class="btn-success"
              onClick={() => this.showAddHospitalizationForm = true}
            >
              + Pridať hospitalizáciu
            </button>
          </div>

          {this.patient.hospitalization_records.length === 0 ? (
            <div class="no-hospitalizations">
              <p>Žiadne záznamy o hospitalizáciách</p>
            </div>
          ) : (
            <div class="hospitalizations-list">
              {this.patient.hospitalization_records.map((record, index) => (
                <div key={record.id} class="hospitalization-card">
                  <div class="hospitalization-header">
                    <span class="hospitalization-number">Hospitalizácia #{index + 1}</span>
                    <div class="hospitalization-actions">
                      <button
                        class="edit-btn"
                        onClick={() => this.handleEditHospitalization(record)}
                        title="Upraviť záznam"
                      >
                        ✏️
                      </button>
                      <button
                        class="delete-btn"
                        onClick={() => this.handleDeleteHospitalization(record.id)}
                        title="Vymazať záznam"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  <div class="hospitalization-content">
                    <p class="description">{record.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Patient Form Modal */}
        {this.showEditForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Upraviť údaje pacienta</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showEditForm = false}
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
                      value={this.editPatient.first_name || ''}
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        first_name: (e.target as HTMLInputElement).value
                      }}
                    />
                  </div>

                  <div class="form-group">
                    <label>Priezvisko *</label>
                    <input
                      type="text"
                      value={this.editPatient.last_name || ''}
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        last_name: (e.target as HTMLInputElement).value
                      }}
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Dátum narodenia *</label>
                    <input
                      type="date"
                      value={this.editPatient.birth_date || ''}
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
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
                      value={this.editPatient.age || ''}
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        age: parseInt((e.target as HTMLInputElement).value) || 0
                      }}
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Pohlavie</label>
                    <select
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        gender: (e.target as HTMLSelectElement).value
                      }}
                    >
                      <option value="M" selected={this.editPatient.gender === 'M'}>Muž</option>
                      <option value="F" selected={this.editPatient.gender === 'F'}>Žena</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Telefón</label>
                  <input
                    type="tel"
                    value={this.editPatient.phone || ''}
                    onInput={(e) => this.editPatient = {
                      ...this.editPatient,
                      phone: (e.target as HTMLInputElement).value
                    }}
                  />
                </div>

                <div class="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={this.editPatient.email || ''}
                    onInput={(e) => this.editPatient = {
                      ...this.editPatient,
                      email: (e.target as HTMLInputElement).value
                    }}
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showEditForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleUpdatePatient()}
                >
                  Uložiť zmeny
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Hospitalization Form Modal */}
        {this.showAddHospitalizationForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Pridať hospitalizáciu</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showAddHospitalizationForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Popis hospitalizácie *</label>
                  <textarea
                    value={this.newHospitalization.description}
                    onInput={(e) => this.newHospitalization = {
                      description: (e.target as HTMLTextAreaElement).value
                    }}
                    placeholder="Opíšte dôvod a priebeh hospitalizácie..."
                    rows={4}
                  ></textarea>
                </div>
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showAddHospitalizationForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-success"
                  onClick={() => this.handleAddHospitalization()}
                >
                  Pridať hospitalizáciu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Hospitalization Form Modal */}
        {this.showEditHospitalizationForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Upraviť hospitalizáciu</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showEditHospitalizationForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Popis hospitalizácie *</label>
                  <textarea
                    value={this.editHospitalization.description}
                    onInput={(e) => this.editHospitalization = {
                      ...this.editHospitalization,
                      description: (e.target as HTMLTextAreaElement).value
                    }}
                    placeholder="Opíšte dôvod a priebeh hospitalizácie..."
                    rows={4}
                  ></textarea>
                </div>
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showEditHospitalizationForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleUpdateHospitalization()}
                >
                  Uložiť zmeny
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
