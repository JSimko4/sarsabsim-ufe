import { Component, h, State, Prop, Event, EventEmitter } from '@stencil/core';
import { HospitalApiService } from '../../utils/hospital-api-service';
import { Patient, PatientGenderEnum } from '../../api/hospital-management';

@Component({
  tag: 'hospital-patient-detail',
  styleUrl: 'hospital-patient-detail.css',
  shadow: true,
})
export class HospitalPatientDetail {
  @Prop() apiBase: string;
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

  private hospitalApiService: HospitalApiService;

  async componentWillLoad() {
    this.hospitalApiService = new HospitalApiService(this.apiBase);
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
      this.patient = await this.hospitalApiService.getPatient(this.patientId);
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
    if (this.patient) {
      // Jednoducho skopíruj všetky údaje z aktuálneho pacienta
      this.editPatient = {
        firstName: this.patient?.firstName || '',
        lastName: this.patient?.lastName || '',
        birthDate: this.patient?.birthDate || new Date(),
        gender: this.patient?.gender || PatientGenderEnum.M,
        phone: this.patient?.phone || '',
        email: this.patient?.email || ''
      };
      this.showEditForm = true;
    }
  }

  private async handleUpdatePatient() {
    if (!this.editPatient.firstName || !this.editPatient.lastName || !this.editPatient.birthDate) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      const updatedData = {
        firstName: this.editPatient.firstName,
        lastName: this.editPatient.lastName,
        birthDate: this.editPatient.birthDate,
        gender: this.editPatient.gender,
        phone: this.editPatient.phone,
        email: this.editPatient.email,
        hospitalizationRecords: this.patient?.hospitalizationRecords || []
      };

      console.log('UPDATE: Posielam na server:', updatedData);

      const result = await this.hospitalApiService.updatePatient(this.patientId, updatedData);

      console.log('UPDATE: Výsledok zo servera:', result);

      if (result) {
        this.patient = result;
        this.editPatient = { ...result };
        this.showEditForm = false;

        console.log('UPDATE: Pacient úspešne aktualizovaný');
      }
    } catch (error) {
      console.error('UPDATE ERROR:', error);
      alert('Chyba pri aktualizácii pacienta');
    }
  }

  private async handleAddHospitalization() {
    if (!this.newHospitalization.description.trim()) {
      alert('Prosím zadajte popis hospitalizácie');
      return;
    }

    try {
      const updatedPatient = await this.hospitalApiService.addHospitalizationRecord(
        this.patientId,
        { description: this.newHospitalization.description.trim() }
      );

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
      const updatedPatient = await this.hospitalApiService.updateHospitalizationRecord(
        this.patientId,
        this.editHospitalization.id,
        { description: this.editHospitalization.description.trim() }
      );

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
      const updatedPatient = await this.hospitalApiService.deleteHospitalizationRecord(
        this.patientId,
        hospitalizationId
      );

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
          <h2>{this.patient.firstName} {this.patient.lastName}</h2>
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
                <span class="value">{this.patient.firstName} {this.patient.lastName}</span>
              </div>
              <div class="info-item">
                <span class="label">Vek:</span>
                <span class="value">{this.patient.age || this.calculateAge(this.patient.birthDate)} rokov</span>
              </div>
              <div class="info-item">
                <span class="label">Dátum narodenia:</span>
                <span class="value">{this.formatDate(this.patient.birthDate)}</span>
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
                <span class="value">{this.formatDate(this.patient.createdAt!)}</span>
              </div>
              <div class="info-item">
                <span class="label">Aktualizovaný:</span>
                <span class="value">{this.formatDate(this.patient.updatedAt!)}</span>
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

          {this.patient.hospitalizationRecords.length === 0 ? (
            <div class="no-hospitalizations">
              <p>Žiadne záznamy o hospitalizáciách</p>
            </div>
          ) : (
            <div class="hospitalizations-list">
              {this.patient.hospitalizationRecords.map((record, index) => (
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
                      value={this.editPatient.firstName || ''}
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        firstName: (e.target as HTMLInputElement).value
                      }}
                    />
                  </div>

                  <div class="form-group">
                    <label>Priezvisko *</label>
                    <input
                      type="text"
                      value={this.editPatient.lastName || ''}
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        lastName: (e.target as HTMLInputElement).value
                      }}
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Dátum narodenia *</label>
                    <input
                      type="date"
                      value={this.editPatient.birthDate ? (typeof this.editPatient.birthDate === 'string' ? this.editPatient.birthDate : this.editPatient.birthDate.toISOString().split('T')[0]) : ''}
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        birthDate: new Date((e.target as HTMLInputElement).value)
                      }}
                    />
                  </div>

                  <div class="form-group">
                    <label>Pohlavie</label>
                    <select
                      onInput={(e) => this.editPatient = {
                        ...this.editPatient,
                        gender: (e.target as HTMLSelectElement).value as PatientGenderEnum
                      }}
                    >
                      <option value={PatientGenderEnum.M} selected={this.editPatient.gender === PatientGenderEnum.M}>Muž</option>
                      <option value={PatientGenderEnum.F} selected={this.editPatient.gender === PatientGenderEnum.F}>Žena</option>
                    </select>
                  </div>
                </div>

                <div class="form-row">
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
