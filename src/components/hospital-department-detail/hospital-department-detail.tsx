import { Component, h, State, Prop, Event, EventEmitter } from '@stencil/core';
import { Department, Bed, HospitalDataService, Patient } from '../../utils/hospital-data';

@Component({
  tag: 'hospital-department-detail',
  styleUrl: 'hospital-department-detail.css',
  shadow: true,
})
export class HospitalDepartmentDetail {
  @Prop() departmentId: string;
  @State() department: Department | null = null;
  @State() beds: Bed[] = [];
  @State() patients: Patient[] = [];
  @State() loading: boolean = true;
  @State() showAddBedForm: boolean = false;
  @State() newBed: Partial<Bed> = {};

  @Event() navigate: EventEmitter<{page: string, id: string}>;
  @Event() back: EventEmitter<void>;

  async componentWillLoad() {
    await this.loadData();
  }

  async componentWillUpdate() {
    if (this.departmentId) {
      await this.loadData();
    }
  }

  private async loadData() {
    this.loading = true;
    try {
      const [department, beds, patients] = await Promise.all([
        HospitalDataService.getDepartment(this.departmentId),
        HospitalDataService.getBedsByDepartment(this.departmentId),
        HospitalDataService.getPatients()
      ]);

      this.department = department;
      this.beds = beds;
      this.patients = patients;
    } catch (error) {
      console.error('Error loading department data:', error);
    } finally {
      this.loading = false;
    }
  }

  private handleBedClick(bed: Bed) {
    this.navigate.emit({ page: 'bed-detail', id: bed._id });
  }

  private async handleAddBed() {
    if (!this.newBed.bed_type) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      const bedData: Omit<Bed, '_id' | 'created_at' | 'updated_at'> = {
        department_id: this.departmentId,
        bed_type: this.newBed.bed_type,
        bed_quality: this.newBed.bed_quality || 0.8,
        status: {
          description: 'Nové lôžko - voľné'
        }
      };

      await HospitalDataService.createBed(bedData);

      this.showAddBedForm = false;
      this.newBed = {};
      await this.loadData();
    } catch (error) {
      console.error('Error creating bed:', error);
      alert('Chyba pri vytváraní lôžka');
    }
  }

  private getPatientName(patientId: string): string {
    const patient = this.patients.find(p => p._id === patientId);
    return patient ? `${patient.first_name} ${patient.last_name}` : 'Neznámy pacient';
  }

  private getBedStatusClass(bed: Bed): string {
    return bed.status.patient_id ? 'bed-occupied' : 'bed-available';
  }

  private getBedStatusText(bed: Bed): string {
    return bed.status.patient_id ? 'Obsadené' : 'Voľné';
  }

  render() {
    if (this.loading) {
      return (
        <div class="container">
          <div class="loading">Načítavam údaje oddelenia...</div>
        </div>
      );
    }

    if (!this.department) {
      return (
        <div class="container">
          <div class="error">Oddelenie nenájdené</div>
        </div>
      );
    }

    return (
      <div class="container">
        <div class="header">
          <button class="back-btn" onClick={() => this.back.emit()}>
            ← Späť na zoznam
          </button>
          <h2>{this.department.name}</h2>
          <button
            class="btn-primary"
            onClick={() => this.showAddBedForm = true}
          >
            + Pridať lôžko
          </button>
        </div>

        <div class="department-info">
          <div class="info-card">
            <h3>Informácie o oddelení</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Popis:</span>
                <span>{this.department.description}</span>
              </div>
              <div class="info-item">
                <span class="label">Poschodie:</span>
                <span>{this.department.floor}</span>
              </div>
              <div class="info-item">
                <span class="label">Maximálna kapacita:</span>
                <span>{this.department.capacity.maximum_beds} lôžok</span>
              </div>
              <div class="info-item">
                <span class="label">Aktuálne lôžka:</span>
                <span>{this.department.capacity.actual_beds}</span>
              </div>
              <div class="info-item">
                <span class="label">Obsadené:</span>
                <span class="occupied">{this.department.capacity.occupied_beds}</span>
              </div>
              <div class="info-item">
                <span class="label">Voľné:</span>
                <span class="available">
                  {this.department.capacity.actual_beds - this.department.capacity.occupied_beds}
                </span>
              </div>
            </div>
          </div>

          <div class="occupancy-chart">
            <h4>Obsadenosť</h4>
            <div class="chart-container">
              <div class="chart-bar">
                <div
                  class="chart-fill"
                  style={{
                    width: `${(this.department.capacity.occupied_beds / this.department.capacity.actual_beds) * 100 || 0}%`
                  }}
                ></div>
              </div>
              <div class="chart-labels">
                <span class="available">
                  Voľné: {this.department.capacity.actual_beds - this.department.capacity.occupied_beds}
                </span>
                <span class="occupied">
                  Obsadené: {this.department.capacity.occupied_beds}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="beds-section">
          <h3>Lôžka oddelenia</h3>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-color bed-available"></div>
              <span>Voľné lôžko</span>
            </div>
            <div class="legend-item">
              <div class="legend-color bed-occupied"></div>
              <span>Obsadené lôžko</span>
            </div>
          </div>

          <div class="beds-grid">
            {this.beds.map(bed => (
              <div
                key={bed._id}
                class={`bed-card ${this.getBedStatusClass(bed)}`}
                onClick={() => this.handleBedClick(bed)}
              >
                <div class="bed-header">
                  <span class="bed-id">Lôžko #{bed._id.slice(-4)}</span>
                  <span class={`bed-status ${this.getBedStatusClass(bed)}`}>
                    {this.getBedStatusText(bed)}
                  </span>
                </div>

                <div class="bed-info">
                  <div class="bed-detail">
                    <span class="label">Typ:</span>
                    <span>{bed.bed_type}</span>
                  </div>
                  <div class="bed-detail">
                    <span class="label">Kvalita:</span>
                    <span>{(bed.bed_quality * 100).toFixed(0)}%</span>
                  </div>

                  {bed.status.patient_id && (
                    <div class="bed-detail">
                      <span class="label">Pacient:</span>
                      <span class="patient-name">
                        {this.getPatientName(bed.status.patient_id)}
                      </span>
                    </div>
                  )}

                  <div class="bed-detail">
                    <span class="label">Poznámka:</span>
                    <span class="description">{bed.status.description}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {this.showAddBedForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Pridať nové lôžko</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showAddBedForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Typ lôžka *</label>
                  <select
                    onInput={(e) => this.newBed = {
                      ...this.newBed,
                      bed_type: (e.target as HTMLSelectElement).value
                    }}
                  >
                    <option value="">Vyberte typ lôžka</option>
                    <option value="standard">Štandardné</option>
                    <option value="intensive">Intenzívne</option>
                    <option value="isolation">Izolačné</option>
                    <option value="recovery">Rekonvalescenčné</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Kvalita lôžka (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={this.newBed.bed_quality || 0.8}
                    onInput={(e) => this.newBed = {
                      ...this.newBed,
                      bed_quality: parseFloat((e.target as HTMLInputElement).value)
                    }}
                  />
                </div>
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => this.showAddBedForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleAddBed()}
                >
                  Pridať
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}
