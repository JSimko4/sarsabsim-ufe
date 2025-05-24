import { Component, h, State, Prop, Event, EventEmitter } from '@stencil/core';
import { HospitalApiService } from '../../utils/hospital-api-service';
import { Bed, Patient, BedBedTypeEnum } from '../../api/hospital-management';

@Component({
  tag: 'hospital-bed-detail',
  styleUrl: 'hospital-bed-detail.css',
  shadow: true,
})
export class HospitalBedDetail {
  @Prop() apiBase: string;
  @Prop() bedId: string;
  @State() bed: Bed | null = null;
  @State() patient: Patient | null = null;
  @State() allPatients: Patient[] = [];
  @State() loading: boolean = true;
  @State() showAssignPatientForm: boolean = false;
  @State() showEditBedForm: boolean = false;
  @State() selectedPatientId: string = '';
  @State() editBed: Partial<Bed> = {};

  @Event() back: EventEmitter<void>;

  private hospitalApiService: HospitalApiService;

  async componentWillLoad() {
    this.hospitalApiService = new HospitalApiService(this.apiBase);
    await this.loadData();
  }

  async componentWillUpdate() {
    if (this.bedId) {
      await this.loadData();
    }
  }

  private async loadData() {
    this.loading = true;
    try {
      const [bed, patients] = await Promise.all([
        this.hospitalApiService.getBed(this.bedId),
        this.hospitalApiService.getPatients()
      ]);

      this.bed = bed;
      this.allPatients = patients;

      // Load patient details if bed is occupied
      if (bed?.status.patientId) {
        this.patient = await this.hospitalApiService.getPatient(bed.status.patientId);
      } else {
        this.patient = null;
      }
    } catch (error) {
      console.error('Error loading bed data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async handleAssignPatient() {
    if (!this.selectedPatientId) {
      alert('Prosím vyberte pacienta');
      return;
    }

    try {
      const selectedPatient = this.allPatients.find(p => p.id === this.selectedPatientId);
      if (!selectedPatient) {
        alert('Pacient nenájdený');
        return;
      }

      // Update bed status
      const updatedBed = await this.hospitalApiService.updateBed(this.bedId, {
        status: {
          patientId: this.selectedPatientId,
          description: `Obsadené pacientom ${selectedPatient.firstName} ${selectedPatient.lastName}`
        }
      });

      // Add hospitalization record to patient
      await this.hospitalApiService.addHospitalizationRecord(this.selectedPatientId, {
        description: `Hospitalizácia na lôžku ${this.bed?.id} - ${this.bed?.bedType}`
      });

      this.showAssignPatientForm = false;
      this.selectedPatientId = '';
      await this.loadData();
    } catch (error) {
      console.error('Error assigning patient:', error);
      alert('Chyba pri priradení pacienta');
    }
  }

  private async handleDischargePatient() {
    if (!confirm('Naozaj chcete prepustiť pacienta z lôžka?')) {
      return;
    }

    try {
      // Update bed status to available
      await this.hospitalApiService.updateBed(this.bedId, {
        status: {
          patientId: '',
          description: 'Voľné lôžko'
        }
      });

      this.showAssignPatientForm = false;
      await this.loadData();
    } catch (error) {
      console.error('Error discharging patient:', error);
      alert('Chyba pri prepustení pacienta');
    }
  }

  private handleOpenEditForm() {
    this.editBed = { ...this.bed };
    this.showEditBedForm = true;
  }

  private async handleUpdateBed() {
    try {
      const updatedBed = await this.hospitalApiService.updateBed(this.bedId, this.editBed);

      if (updatedBed) {
        this.bed = { ...updatedBed };
      }

      this.showEditBedForm = false;
      this.editBed = {};
    } catch (error) {
      console.error('Error updating bed:', error);
      alert('Chyba pri aktualizácii lôžka');
    }
  }

  private getBedStatusClass(): string {
    return this.bed?.status.patientId ? 'occupied' : 'available';
  }

  private getBedStatusText(): string {
    return this.bed?.status.patientId ? 'Obsadené' : 'Voľné';
  }

  private getAvailablePatients(): Patient[] {
    // Filter out patients who are already assigned to other beds
    return this.allPatients.filter(patient => {
      // You might want to add logic here to check if patient is already hospitalized
      return true;
    });
  }

  render() {
    if (this.loading) {
      return (
        <div class="container">
          <div class="loading">Načítavam údaje lôžka...</div>
        </div>
      );
    }

    if (!this.bed) {
      return (
        <div class="container">
          <div class="error">Lôžko nenájdené</div>
        </div>
      );
    }

    return (
      <div class="container">
        <div class="header">
          <button class="back-btn" onClick={() => this.back.emit()}>
            ← Späť
          </button>
          <h2>Lôžko #{this.bed.id?.slice(-4)}</h2>
          <div class="header-actions">
            <button
              class="btn-secondary"
              onClick={() => this.handleOpenEditForm()}
            >
              ✏️ Upraviť lôžko
            </button>
            {this.bed.status.patientId ? (
              <button
                class="btn-warning"
                onClick={() => this.handleDischargePatient()}
              >
                🏥 Prepustiť pacienta
              </button>
            ) : (
              <button
                class="btn-success"
                onClick={() => this.showAssignPatientForm = true}
              >
                👤 Priradiť pacienta
              </button>
            )}
          </div>
        </div>

        <div class="bed-info">
          <div class="info-card">
            <h3>Informácie o lôžku</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">ID:</span>
                <span>{this.bed.id}</span>
              </div>
              <div class="info-item">
                <span class="label">Typ:</span>
                <span>{this.bed.bedType}</span>
              </div>
              <div class="info-item">
                <span class="label">Kvalita:</span>
                <span>{(this.bed.bedQuality * 100).toFixed(0)}%</span>
              </div>
              <div class="info-item">
                <span class="label">Stav:</span>
                <span class={`status-badge ${this.getBedStatusClass()}`}>
                  {this.getBedStatusText()}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Poznámka:</span>
                <span>{this.bed.status.description}</span>
              </div>
            </div>
          </div>

          {this.patient && (
            <div class="patient-card">
              <h3>Aktuálny pacient</h3>
              <div class="patient-info">
                <div class="patient-detail">
                  <span class="label">Meno:</span>
                  <span>{this.patient.firstName} {this.patient.lastName}</span>
                </div>
                <div class="patient-detail">
                  <span class="label">Vek:</span>
                  <span>{this.patient.age} rokov</span>
                </div>
                <div class="patient-detail">
                  <span class="label">Pohlavie:</span>
                  <span>{this.patient.gender === 'M' ? 'Muž' : 'Žena'}</span>
                </div>
                <div class="patient-detail">
                  <span class="label">Telefón:</span>
                  <span>{this.patient.phone || 'Nezadané'}</span>
                </div>
                <div class="patient-detail">
                  <span class="label">Email:</span>
                  <span>{this.patient.email || 'Nezadané'}</span>
                </div>
              </div>
            </div>
          )}
                    </div>

        {/* Assign Patient Modal */}
        {this.showAssignPatientForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Priradiť pacienta k lôžku</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showAssignPatientForm = false}
                >
                  ×
                </button>
                    </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Vyberte pacienta *</label>
                  <select
                    required
                    onInput={(e) => this.selectedPatientId = (e.target as HTMLSelectElement).value}
                  >
                    <option value="">Vyberte pacienta</option>
                    {this.getAvailablePatients().map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName} (Vek: {patient.age})
                      </option>
                    ))}
                  </select>
                    </div>
                  </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showAssignPatientForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleAssignPatient()}
                >
                  Priradiť
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bed Modal */}
        {this.showEditBedForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Upraviť lôžko</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showEditBedForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Typ lôžka</label>
                  <select
                    onInput={(e) => this.editBed = {
                      ...this.editBed,
                      bedType: (e.target as HTMLSelectElement).value as BedBedTypeEnum
                    }}
                  >
                    <option value={BedBedTypeEnum.Standard} selected={this.editBed.bedType === BedBedTypeEnum.Standard}>Štandardné</option>
                    <option value={BedBedTypeEnum.Intensive} selected={this.editBed.bedType === BedBedTypeEnum.Intensive}>Intenzívne</option>
                    <option value={BedBedTypeEnum.Isolation} selected={this.editBed.bedType === BedBedTypeEnum.Isolation}>Izolačné</option>
                    <option value={BedBedTypeEnum.Recovery} selected={this.editBed.bedType === BedBedTypeEnum.Recovery}>Zotavovňa</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Kvalita lôžka (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={this.editBed.bedQuality}
                    onInput={(e) => this.editBed = {
                      ...this.editBed,
                      bedQuality: parseFloat((e.target as HTMLInputElement).value)
                    }}
                  />
                </div>

                <div class="form-group">
                  <label>Poznámka</label>
                  <textarea
                    value={this.editBed.status?.description}
                    onInput={(e) => this.editBed = {
                      ...this.editBed,
                      status: {
                        ...this.editBed.status,
                        description: (e.target as HTMLTextAreaElement).value
                      }
                    }}
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showEditBedForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleUpdateBed()}
                >
                  Uložiť
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
