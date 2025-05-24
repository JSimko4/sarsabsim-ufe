import { Component, h, State, Prop, Event, EventEmitter } from '@stencil/core';
import { Bed, Patient, HospitalDataService } from '../../utils/hospital-data';

@Component({
  tag: 'hospital-bed-detail',
  styleUrl: 'hospital-bed-detail.css',
  shadow: true,
})
export class HospitalBedDetail {
  @Prop() bedId: string;
  @State() bed: Bed | null = null;
  @State() patients: Patient[] = [];
  @State() loading: boolean = true;
  @State() showEditForm: boolean = false;
  @State() showOccupyForm: boolean = false;
  @State() editBed: Partial<Bed> = {};
  @State() selectedPatientId: string = '';

  @Event() back: EventEmitter<void>;

  async componentWillLoad() {
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
        HospitalDataService.getBed(this.bedId),
        HospitalDataService.getPatients()
      ]);

      this.bed = bed;
      this.patients = patients;

      if (this.bed) {
        this.editBed = { ...this.bed };
      }
    } catch (error) {
      console.error('Error loading bed data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async handleUpdateBed() {
    if (!this.editBed.bed_type) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      await HospitalDataService.updateBed(this.bedId, {
        bed_type: this.editBed.bed_type,
        bed_quality: this.editBed.bed_quality,
        status: {
          ...this.bed?.status,
          description: this.editBed.status?.description || this.bed?.status?.description || ''
        }
      });

      this.showEditForm = false;
      await this.loadData();
      // Force re-render
      this.bed = { ...this.bed };
    } catch (error) {
      console.error('Error updating bed:', error);
      alert('Chyba pri aktualizácii lôžka');
    }
  }

  private async handleOccupyBed() {
    if (!this.selectedPatientId) {
      alert('Prosím vyberte pacienta');
      return;
    }

    try {
      await HospitalDataService.updateBed(this.bedId, {
        status: {
          patient_id: this.selectedPatientId,
          description: 'Lôžko obsadené'
        }
      });

      this.showOccupyForm = false;
      this.selectedPatientId = '';
      await this.loadData();
    } catch (error) {
      console.error('Error occupying bed:', error);
      alert('Chyba pri obsadzovaní lôžka');
    }
  }

  private async handleFreeBed() {
    if (!confirm('Naozaj chcete uvoľniť toto lôžko?')) {
      return;
    }

    try {
      await HospitalDataService.updateBed(this.bedId, {
        status: {
          description: 'Lôžko je voľné'
        }
      });

      await this.loadData();
    } catch (error) {
      console.error('Error freeing bed:', error);
      alert('Chyba pri uvoľňovaní lôžka');
    }
  }

  private getPatientName(patientId: string): string {
    const patient = this.patients.find(p => p._id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Neznámy pacient';
  }

  private getAvailablePatients(): Patient[] {
    return this.patients.filter(patient =>
      !this.getAllOccupiedPatientIds().includes(patient._id)
    );
  }

  private getAllOccupiedPatientIds(): string[] {
    // V reálnej aplikácii by sme získali všetky obsadené lôžka
    // Pre teraz vrátime prázdny zoznam
    return [];
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

    const isOccupied = !!this.bed.status.patient_id;
    const availablePatients = this.getAvailablePatients();

    return (
      <div class="container">
        <div class="header">
          <button class="back-btn" onClick={() => this.back.emit()}>
            ← Späť na oddelenie
          </button>
          <h2>Lôžko #{this.bed._id.slice(-4)}</h2>
          <div class="actions">
            <button
              class="btn-secondary"
              onClick={() => this.showEditForm = true}
            >
              ✏️ Upraviť lôžko
            </button>
            {isOccupied ? (
              <button
                class="btn-warning"
                onClick={() => this.handleFreeBed()}
              >
                🚪 Uvoľniť lôžko
              </button>
            ) : (
              <button
                class="btn-success"
                onClick={() => this.showOccupyForm = true}
              >
                👤 Obsadiť lôžko
              </button>
            )}
          </div>
        </div>

        <div class="bed-info">
          <div class="status-card">
            <div class={`status-indicator ${isOccupied ? 'occupied' : 'available'}`}>
              <span class="status-icon">{isOccupied ? '🔴' : '🟢'}</span>
              <span>{isOccupied ? 'OBSADENÉ' : 'VOĽNÉ'}</span>
            </div>
          </div>

          <div class="details-grid">
            <div class="detail-card">
              <h3>Základné informácie</h3>
              <div class="detail-list">
                <div class="detail-item">
                  <span class="label">ID lôžka:</span>
                  <span class="value">{this.bed._id}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Typ lôžka:</span>
                  <span class="value">{this.bed.bed_type}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Kvalita:</span>
                  <span class="value">
                    <div class="quality-bar">
                      <div
                        class="quality-fill"
                        style={{width: `${this.bed.bed_quality * 100}%`}}
                      ></div>
                    </div>
                    {(this.bed.bed_quality * 100).toFixed(0)}%
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">Stav:</span>
                  <span class={`value ${isOccupied ? '' : 'available'}`}>
                    {isOccupied ? 'Obsadené' : 'Voľné'}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="label">Popis:</span>
                  <span class="value description">{this.bed.status.description}</span>
                </div>
              </div>
            </div>

            <div class="detail-card">
              <h3>Informácie o pacientovi</h3>
              <div class="detail-list">
                {isOccupied ? (
                  <>
                    <div class="detail-item">
                      <span class="label">Pacient:</span>
                      <span class="value patient-name">
                        {this.getPatientName(this.bed.status.patient_id!)}
                      </span>
                    </div>
                    <div class="detail-item">
                      <span class="label">ID pacienta:</span>
                      <span class="value">{this.bed.status.patient_id}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Dátum obsadenia:</span>
                      <span class="value">{new Date(this.bed.updated_at).toLocaleDateString('sk-SK')}</span>
                    </div>
                  </>
                ) : (
                  <div class="detail-item">
                    <span class="value available">Lôžko je momentálne voľné</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Bed Form Modal */}
        {this.showEditForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Upraviť lôžko</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showEditForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Typ lôžka *</label>
                  <select
                    onInput={(e) => this.editBed = {
                      ...this.editBed,
                      bed_type: (e.target as HTMLSelectElement).value
                    }}
                  >
                    <option value="standard" selected={this.editBed.bed_type === 'standard'}>Štandardné</option>
                    <option value="intensive" selected={this.editBed.bed_type === 'intensive'}>Intenzívne</option>
                    <option value="isolation" selected={this.editBed.bed_type === 'isolation'}>Izolačné</option>
                    <option value="recovery" selected={this.editBed.bed_type === 'recovery'}>Rekonvalescenčné</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Kvalita lôžka (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={this.editBed.bed_quality || 0.8}
                    onInput={(e) => this.editBed = {
                      ...this.editBed,
                      bed_quality: parseFloat((e.target as HTMLInputElement).value)
                    }}
                  />
                </div>

                <div class="form-group">
                  <label>Popis/Poznámka</label>
                  <textarea
                    value={this.editBed.status?.description || ''}
                    onInput={(e) => this.editBed = {
                      ...this.editBed,
                      status: {
                        ...this.editBed.status,
                        description: (e.target as HTMLTextAreaElement).value
                      }
                    }}
                    rows={3}
                  ></textarea>
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
                  onClick={() => this.handleUpdateBed()}
                >
                  Uložiť zmeny
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Occupy Bed Form Modal */}
        {this.showOccupyForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Obsadiť lôžko</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showOccupyForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Vyberte pacienta *</label>
                                     <select
                     onInput={(e) => this.selectedPatientId = (e.target as HTMLSelectElement).value}
                   >
                                         <option value="" selected={!this.selectedPatientId}>-- Vyberte pacienta --</option>
                     {availablePatients.map(patient => (
                       <option key={patient._id} value={patient._id} selected={this.selectedPatientId === patient._id}>
                         {patient.first_name} {patient.last_name} (ID: {patient._id.slice(-4)})
                       </option>
                     ))}
                  </select>
                </div>

                {availablePatients.length === 0 && (
                  <div class="no-patients">
                    <p>Žiadni dostupní pacienti pre obsadenie lôžka.</p>
                  </div>
                )}
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showOccupyForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-success"
                  onClick={() => this.handleOccupyBed()}
                  disabled={!this.selectedPatientId}
                >
                  Obsadiť lôžko
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
