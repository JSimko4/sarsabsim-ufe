import { Component, h, State, Prop, Event, EventEmitter } from '@stencil/core';
import { HospitalApiService } from '../../utils/hospital-api-service';
import { Department, Bed, BedBedTypeEnum } from '../../api/hospital-management';

@Component({
  tag: 'hospital-department-detail',
  styleUrl: 'hospital-department-detail.css',
  shadow: true,
})
export class HospitalDepartmentDetail {
  @Prop() apiBase: string;
  @Prop() departmentId: string;
  @State() department: Department | null = null;
  @State() beds: Bed[] = [];
  @State() loading: boolean = true;
  @State() showAddBedForm: boolean = false;
  @State() newBed: Partial<Bed> = {};

  @Event() back: EventEmitter<void>;
  @Event() bedSelected: EventEmitter<string>;

  private hospitalApiService: HospitalApiService;

  async componentWillLoad() {
    this.hospitalApiService = new HospitalApiService(this.apiBase);
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
      const [department, beds] = await Promise.all([
        this.hospitalApiService.getDepartment(this.departmentId),
        this.hospitalApiService.getBedsByDepartment(this.departmentId)
      ]);

      this.department = department;
      this.beds = beds;
    } catch (error) {
      console.error('Error loading department data:', error);
    } finally {
      this.loading = false;
    }
  }

  private handleBedClick(bed: Bed) {
    this.bedSelected.emit(bed.id!);
  }

  private async handleAddBed() {
    if (!this.newBed.bedType) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      const bedData = {
        departmentId: this.departmentId,
        bedType: this.newBed.bedType,
        bedQuality: this.newBed.bedQuality || 0.8,
        status: {
          description: 'Nové lôžko'
        }
      };

      await this.hospitalApiService.createBed(this.departmentId, bedData);

      // Update department capacity
      if (this.department) {
        await this.hospitalApiService.updateDepartment(this.departmentId, {
          capacity: {
            ...this.department.capacity,
            actualBeds: this.department.capacity.actualBeds + 1
          }
        });
      }

      this.showAddBedForm = false;
      this.newBed = {};
      await this.loadData();
    } catch (error) {
      console.error('Error creating bed:', error);
      alert('Chyba pri vytváraní lôžka');
    }
  }

  private getBedStatusClass(bed: Bed): string {
    return bed.status.patientId ? 'occupied' : 'available';
  }

  private getPatientName(patientId: string): string {
    // TODO: Load patient data separately if needed
    return 'Pacient';
  }

  private getBedStatusText(bed: Bed): string {
    return bed.status.patientId ? 'Obsadené' : 'Voľné';
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
                <span>{this.department.capacity.maximumBeds} lôžok</span>
              </div>
              <div class="info-item">
                <span class="label">Aktuálne lôžka:</span>
                <span>{this.department.capacity.actualBeds}</span>
              </div>
              <div class="info-item">
                <span class="label">Obsadené:</span>
                <span class="occupied">{this.department.capacity.occupiedBeds}</span>
              </div>
              <div class="info-item">
                <span class="label">Voľné:</span>
                <span class="available">
                  {this.department.capacity.actualBeds - this.department.capacity.occupiedBeds}
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
                    width: `${(this.department.capacity.occupiedBeds / this.department.capacity.actualBeds) * 100 || 0}%`
                  }}
                ></div>
              </div>
              <div class="chart-labels">
                <span class="available">
                  Voľné: {this.department.capacity.actualBeds - this.department.capacity.occupiedBeds}
                </span>
                <span class="occupied">
                  Obsadené: {this.department.capacity.occupiedBeds}
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
                key={bed.id}
                class={`bed-card ${this.getBedStatusClass(bed)}`}
                onClick={() => this.handleBedClick(bed)}
              >
                <div class="bed-header">
                  <span class="bed-id">#{bed.id?.slice(-4)}</span>
                  <span class={`status-badge ${this.getBedStatusClass(bed)}`}>
                    {this.getBedStatusText(bed)}
                  </span>
                </div>

                <div class="bed-info">
                  <div class="bed-detail">
                    <span class="label">Typ:</span>
                    <span>{bed.bedType}</span>
                  </div>
                  <div class="bed-detail">
                    <span class="label">Kvalita:</span>
                    <span>{(bed.bedQuality * 100).toFixed(0)}%</span>
                  </div>

                  {bed.status.patientId && (
                    <div class="bed-detail">
                      <span class="label">Pacient:</span>
                      <span class="patient-name">
                        {this.getPatientName(bed.status.patientId)}
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
                    required
                    onInput={(e) => this.newBed = {
                      ...this.newBed,
                      bedType: (e.target as HTMLSelectElement).value as BedBedTypeEnum
                    }}
                  >
                    <option value="">Vyberte typ lôžka</option>
                    <option value={BedBedTypeEnum.Standard}>Štandardné</option>
                    <option value={BedBedTypeEnum.Intensive}>Intenzívne</option>
                    <option value={BedBedTypeEnum.Isolation}>Izolačné</option>
                    <option value={BedBedTypeEnum.Recovery}>Zotavovňa</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Kvalita lôžka (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={this.newBed.bedQuality || 0.8}
                    onInput={(e) => this.newBed = {
                      ...this.newBed,
                      bedQuality: parseFloat((e.target as HTMLInputElement).value)
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
