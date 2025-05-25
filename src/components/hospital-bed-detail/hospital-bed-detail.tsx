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
    // Remove automatic reload to prevent interference with updates
    // if (this.bedId) {
    //   await this.loadData();
    // }
  }

  private async loadData() {
    this.loading = true;
    try {
      const [bed, patients] = await Promise.all([
        this.hospitalApiService.getBed(this.bedId),
        this.hospitalApiService.getPatients()
      ]);

      console.log('LOAD DATA - Bed from API:', bed);
      this.bed = bed;
      this.allPatients = patients;

      // Load patient details if bed is occupied
      const patientId = bed?.status.patientId || (bed?.status as any)?.patient_id;
      if (patientId && patientId.trim() !== '') {
        this.patient = await this.hospitalApiService.getPatient(patientId);
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

      // Update bed status - first get current bed data to ensure we have complete object
      const currentBed = await this.hospitalApiService.getBed(this.bedId);
      if (!currentBed) {
        alert('Lôžko nenájdené');
        return;
      }

      console.log('ASSIGN PATIENT - Current bed from API:', JSON.stringify(currentBed, null, 2));
      console.log('ASSIGN PATIENT - Current bed departmentId:', currentBed.departmentId);
      console.log('ASSIGN PATIENT - Current bed bedType:', currentBed.bedType);
      console.log('ASSIGN PATIENT - Current bed bedQuality:', currentBed.bedQuality);

      const updatedBedData: Bed = {
        ...currentBed,
        status: {
          patientId: this.selectedPatientId,
          description: `Obsadené pacientom ${selectedPatient.firstName} ${selectedPatient.lastName}`
        }
      };

      console.log('ASSIGN PATIENT - Sending bed object:', JSON.stringify(updatedBedData, null, 2));
      console.log('ASSIGN PATIENT - Sending departmentId:', updatedBedData.departmentId);
      console.log('ASSIGN PATIENT - Sending bedType:', updatedBedData.bedType);
      console.log('ASSIGN PATIENT - Sending bedQuality:', updatedBedData.bedQuality);

      const updatedBed = await this.hospitalApiService.updateBed(this.bedId, updatedBedData);

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
      // Update bed status to available - first get current bed data
      const currentBed = await this.hospitalApiService.getBed(this.bedId);
      if (!currentBed) {
        alert('Lôžko nenájdené');
        return;
      }

      console.log('BEFORE DISCHARGE - Current bed from API:', currentBed);

      const updatedBedData: Bed = {
        ...currentBed,
        status: {
          patientId: '',
          description: 'Voľné lôžko'
        }
      };

      console.log('AFTER DISCHARGE - Sending bed object:', updatedBedData);

      await this.hospitalApiService.updateBed(this.bedId, updatedBedData);

      this.showAssignPatientForm = false;
      await this.loadData();
    } catch (error) {
      console.error('Error discharging patient:', error);
      alert('Chyba pri prepustení pacienta');
    }
  }

  private handleOpenEditForm() {
    // Create a deep copy of the current bed data for editing
    this.editBed = {
      ...this.bed,
      status: {
        ...this.bed.status
      }
    };
    this.showEditBedForm = true;
  }

  private async handleUpdateBed() {
    try {
      // Get fresh bed data from API to ensure we have the latest state
      const currentBed = await this.hospitalApiService.getBed(this.bedId);
      if (!currentBed) {
        alert('Lôžko nenájdené');
        return;
      }

      console.log('BEFORE UPDATE - Current bed from API:', currentBed);

      // Create complete bed object with all required fields, preserving existing values
      // and only updating the fields that were actually changed
      const updatedBedData: Bed = {
        ...currentBed, // Start with current data from API
        // Only override with editBed values that are not null/undefined/empty
        ...(this.editBed.bedType && { bedType: this.editBed.bedType }),
        ...(this.editBed.bedQuality !== undefined && this.editBed.bedQuality !== null && { bedQuality: this.editBed.bedQuality }),
        ...(this.editBed.status && {
          status: {
            ...currentBed.status, // Preserve existing status
            ...(this.editBed.status.description !== undefined && { description: this.editBed.status.description }),
            // Preserve patientId if it exists
            ...(currentBed.status.patientId && { patientId: currentBed.status.patientId })
          }
        })
      };

      console.log('AFTER UPDATE - Sending bed object:', updatedBedData);

      const updatedBed = await this.hospitalApiService.updateBed(this.bedId, updatedBedData);

      if (updatedBed) {
        this.bed = { ...updatedBed };
      }

      this.showEditBedForm = false;
      this.editBed = {};
      await this.loadData(); // Reload data to ensure consistency
    } catch (error) {
      console.error('Error updating bed:', error);
      alert('Chyba pri aktualizácii lôžka');
    }
  }

  private getBedStatusClass(): string {
    // Check for patientId (mapped) or patient_id (raw) and ensure it's not empty
    const patientId = this.bed?.status.patientId || (this.bed?.status as any)?.patient_id;
    const isOccupied = patientId && patientId.trim() !== '';
    return isOccupied ? 'occupied' : 'available';
  }

  private getBedStatusText(): string {
    // Check for patientId (mapped) or patient_id (raw) and ensure it's not empty
    const patientId = this.bed?.status.patientId || (this.bed?.status as any)?.patient_id;
    const isOccupied = patientId && patientId.trim() !== '';
    return isOccupied ? 'Obsadené' : 'Voľné';
  }

  private getAvailablePatients(): Patient[] {
    // Filter out patients who are already assigned to other beds
    return this.allPatients.filter(patient => {
      // You might want to add logic here to check if patient is already hospitalized
      return true;
    });
  }

  private async handleDeleteBed() {
    if (!confirm('Naozaj chcete vymazať toto lôžko? Táto akcia sa nedá vrátiť späť.')) {
      return;
    }

    // Check if bed is occupied
    const patientId = this.bed?.status.patientId || (this.bed?.status as any)?.patient_id;
    if (patientId && patientId.trim() !== '') {
      alert('Nemôžete vymazať obsadené lôžko. Najprv prepustite pacienta.');
      return;
    }

    try {
      // Delete the bed
      const success = await this.hospitalApiService.deleteBed(this.bedId);

      if (success) {
        alert('Lôžko bolo úspešne vymazané');
        this.back.emit(); // Go back to department view
      } else {
        alert('Chyba pri vymazávaní lôžka');
      }
    } catch (error) {
      console.error('Error deleting bed:', error);
      alert('Chyba pri vymazávaní lôžka');
    }
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
            <button
              class="btn-danger"
              onClick={() => this.handleDeleteBed()}
              title="Vymazať lôžko"
            >
              🗑️ Vymazať
            </button>
            {(this.bed.status.patientId || (this.bed.status as any)?.patient_id) ? (
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
                    <option value={BedBedTypeEnum.Standard} selected={(this.editBed.bedType || this.bed?.bedType) === BedBedTypeEnum.Standard}>Štandardné</option>
                    <option value={BedBedTypeEnum.Intensive} selected={(this.editBed.bedType || this.bed?.bedType) === BedBedTypeEnum.Intensive}>Intenzívne</option>
                    <option value={BedBedTypeEnum.Isolation} selected={(this.editBed.bedType || this.bed?.bedType) === BedBedTypeEnum.Isolation}>Izolačné</option>
                    <option value={BedBedTypeEnum.Recovery} selected={(this.editBed.bedType || this.bed?.bedType) === BedBedTypeEnum.Recovery}>Zotavovňa</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Kvalita lôžka (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={this.editBed.bedQuality !== undefined ? this.editBed.bedQuality : this.bed?.bedQuality}
                    onInput={(e) => this.editBed = {
                      ...this.editBed,
                      bedQuality: parseFloat((e.target as HTMLInputElement).value)
                    }}
                  />
                </div>

                <div class="form-group">
                  <label>Poznámka</label>
                  <textarea
                    value={this.editBed.status?.description !== undefined ? this.editBed.status.description : this.bed?.status?.description || ''}
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
