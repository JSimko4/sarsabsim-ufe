import { Component, h, State, Event, EventEmitter, Prop } from '@stencil/core';
import { HospitalApiService } from '../../utils/hospital-api-service';
import { Department, Bed } from '../../api/hospital-management';

@Component({
  tag: 'hospital-departments-list',
  styleUrl: 'hospital-departments-list.css',
  shadow: true,
})
export class HospitalDepartmentsList {
  @Prop() apiBase: string;
  @State() departments: Department[] = [];
  @State() departmentBeds: { [departmentId: string]: Bed[] } = {};
  @State() loading: boolean = true;
  @State() showAddForm: boolean = false;
  @State() showEditForm: boolean = false;
  @State() newDepartment: Partial<Department> = {};
  @State() editDepartment: Partial<Department> = {};
  @State() editingDepartmentId: string = '';

  @Event() departmentSelected: EventEmitter<string>;

  private hospitalApiService: HospitalApiService;

  componentWillLoad() {
    this.hospitalApiService = new HospitalApiService(this.apiBase);
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      this.departments = await this.hospitalApiService.getDepartments();

      // Load beds for each department to calculate actual occupancy
      const bedsPromises = this.departments.map(async (dept) => {
        try {
          const beds = await this.hospitalApiService.getBedsByDepartment(dept.id!);
          return { departmentId: dept.id!, beds };
        } catch (error) {
          console.error(`Error loading beds for department ${dept.id}:`, error);
          return { departmentId: dept.id!, beds: [] };
        }
      });

      const bedsResults = await Promise.all(bedsPromises);

      // Store beds by department ID
      this.departmentBeds = {};
      bedsResults.forEach(({ departmentId, beds }) => {
        this.departmentBeds[departmentId] = beds;
      });

      console.log('DEPARTMENTS LIST - Loaded departments and beds:', {
        departments: this.departments.length,
        departmentBeds: Object.keys(this.departmentBeds).length
      });

    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      this.loading = false;
    }
  }

  private getActualBeds(departmentId: string): number {
    const beds = this.departmentBeds[departmentId] || [];
    return beds.length;
  }

  private getOccupiedBeds(departmentId: string): number {
    const beds = this.departmentBeds[departmentId] || [];
    const occupiedCount = beds.filter(bed => {
      const patientId = bed.status.patientId || (bed.status as any).patient_id;
      return patientId && patientId.trim() !== '';
    }).length;

    // Debug logging
    const dept = this.departments.find(d => d.id === departmentId);
    if (dept) {
      console.log(`DEPARTMENTS LIST - ${dept.name || 'Unnamed'} (${departmentId.slice(-4)}):`, {
        actualBeds: beds.length,
        occupiedBeds: occupiedCount,
        storedOccupied: dept.capacity.occupiedBeds,
        storedActual: dept.capacity.actualBeds
      });
    }

    return occupiedCount;
  }

  private getAvailableBeds(departmentId: string): number {
    return this.getActualBeds(departmentId) - this.getOccupiedBeds(departmentId);
  }

  private handleDepartmentClick(department: Department) {
    this.departmentSelected.emit(department.id!);
  }

  private handleEditDepartment(department: Department) {
    this.editDepartment = { ...department };
    this.editingDepartmentId = department.id!;
    this.showEditForm = true;
  }

  private async handleCreateDepartment() {
    if (!this.newDepartment.name || !this.newDepartment.description ) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    // Use default values if not set
    const floor = this.newDepartment.floor || 1;
    const maximumBeds = this.newDepartment.capacity?.maximumBeds || 20;

    try {
      await this.hospitalApiService.createDepartment({
        name: this.newDepartment.name,
        description: this.newDepartment.description,
        floor: floor,
        capacity: {
          maximumBeds: maximumBeds,
          actualBeds: 0,
          occupiedBeds: 0
        }
      });

      this.showAddForm = false;
      this.newDepartment = {};
      await this.loadData();
    } catch (error) {
      console.error('Error creating department:', error);
      alert('Chyba pri vytváraní oddelenia');
    }
  }

  private async handleUpdateDepartment() {
    if (!this.editDepartment.name || !this.editDepartment.description) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      // Find the original department to get all fields
      const originalDepartment = this.departments.find(d => d.id === this.editingDepartmentId);
      if (!originalDepartment) {
        alert('Oddelenie nenájdené');
        return;
      }

      // Create complete department object with all required fields
      const updatedDepartment: Department = {
        id: originalDepartment.id,
        name: this.editDepartment.name,
        description: this.editDepartment.description,
        floor: this.editDepartment.floor || originalDepartment.floor,
        capacity: this.editDepartment.capacity || originalDepartment.capacity,
        createdAt: originalDepartment.createdAt,
        updatedAt: originalDepartment.updatedAt // This will be updated by the service
      };

      await this.hospitalApiService.updateDepartment(this.editingDepartmentId, updatedDepartment);

      this.showEditForm = false;
      this.editDepartment = {};
      this.editingDepartmentId = '';
      await this.loadData();
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Chyba pri aktualizácii oddelenia');
    }
  }

  private async handleDeleteDepartment(department: Department) {
    // Check if department has beds
    const beds = this.departmentBeds[department.id!] || [];
    if (beds.length > 0) {
      alert('Nemôžete vymazať oddelenie ktoré má lôžka. Najprv vymaže všetky lôžka.');
      return;
    }

    if (!confirm(`Naozaj chcete vymazať oddelenie "${department.name}"? Táto akcia sa nedá vrátiť späť.`)) {
      return;
    }

    try {
      const success = await this.hospitalApiService.deleteDepartment(department.id!);

      if (success) {
        alert('Oddelenie bolo úspešne vymazané');
        await this.loadData(); // Reload the list
      } else {
        alert('Chyba pri vymazávaní oddelenia');
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Chyba pri vymazávaní oddelenia');
    }
  }

  render() {
    if (this.loading) {
      return (
        <div class="container">
          <div class="loading">Načítavam oddelenia...</div>
        </div>
      );
    }

    return (
      <div class="container">
        <div class="header">
          <h2>Oddelenia nemocnice</h2>
          <button
            class="btn-primary"
            onClick={() => {
              this.newDepartment = {
                floor: 1,
                capacity: {
                  maximumBeds: 20,
                  actualBeds: 0,
                  occupiedBeds: 0
                }
              };
              this.showAddForm = true;
            }}
          >
            + Pridať oddelenie
          </button>
        </div>

        <div class="departments-grid">
          {this.departments.map((dept) => (
            <div
              key={dept.id}
              class="department-card"
              onClick={() => this.handleDepartmentClick(dept)}
            >
              <div class="department-header">
                <h3>{dept.name}</h3>
                <div class="department-actions">
                  <button
                    class="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleEditDepartment(dept);
                    }}
                    title="Upraviť oddelenie"
                  >
                    ✏️
                  </button>
                  <button
                    class="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      this.handleDeleteDepartment(dept);
                    }}
                    title="Vymazať oddelenie"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p class="department-description">{dept.description}</p>
              <div class="department-info">
                <div class="info-item">
                  <span class="label">Poschodie:</span>
                  <span class="value">{dept.floor}</span>
                </div>
                <div class="info-item">
                  <span class="label">Kapacita:</span>
                  <span class="value">{this.getOccupiedBeds(dept.id!)}/{this.getActualBeds(dept.id!)}</span>
                </div>
                <div class="capacity-bar">
                  <div
                    class="capacity-fill"
                    style={{width: `${this.getActualBeds(dept.id!) > 0 ? (this.getOccupiedBeds(dept.id!) / this.getActualBeds(dept.id!)) * 100 : 0}%`}}
                  ></div>
                </div>
                <div class="capacity-text">
                  {this.getAvailableBeds(dept.id!)} voľných lôžok
                </div>
              </div>
            </div>
          ))}
        </div>

        {this.showAddForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Pridať nové oddelenie</h3>
                <button
                  class="close-btn"
                  onClick={() => {
                    this.newDepartment = {};
                    this.showAddForm = false;
                  }}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Názov oddelenia *</label>
                  <input
                    type="text"
                    value={this.newDepartment.name || ''}
                    onInput={(e) => this.newDepartment = {
                      ...this.newDepartment,
                      name: (e.target as HTMLInputElement).value
                    }}
                    placeholder="Napr. Interné oddelenie"
                  />
                </div>

                <div class="form-group">
                  <label>Popis *</label>
                  <textarea
                    value={this.newDepartment.description || ''}
                    onInput={(e) => this.newDepartment = {
                      ...this.newDepartment,
                      description: (e.target as HTMLTextAreaElement).value
                    }}
                    placeholder="Krátky popis oddelenia"
                    rows={3}
                  ></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Poschodie</label>
                    <input
                      type="number"
                      min="1"
                      value={this.newDepartment.floor || 1}
                      onInput={(e) => this.newDepartment = {
                        ...this.newDepartment,
                        floor: parseInt((e.target as HTMLInputElement).value)
                      }}
                    />
                  </div>

                  <div class="form-group">
                    <label>Maximum lôžok</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={this.newDepartment.capacity?.maximumBeds || 20}
                      onInput={(e) => this.newDepartment = {
                        ...this.newDepartment,
                        capacity: {
                          ...this.newDepartment.capacity,
                          maximumBeds: parseInt((e.target as HTMLInputElement).value) || 20,
                          actualBeds: 0,
                          occupiedBeds: 0
                        }
                      }}
                      placeholder="20"
                    />
                  </div>
                </div>
              </div>

              <div class="modal-actions">
                <button
                  class="btn-secondary"
                  onClick={() => {
                    this.newDepartment = {};
                    this.showAddForm = false;
                  }}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleCreateDepartment()}
                >
                  Pridať
                </button>
              </div>
            </div>
          </div>
        )}

        {this.showEditForm && (
          <div class="modal-overlay">
            <div class="modal">
              <div class="modal-header">
                <h3>Upraviť oddelenie</h3>
                <button
                  class="close-btn"
                  onClick={() => this.showEditForm = false}
                >
                  ×
                </button>
              </div>

              <div class="modal-content">
                <div class="form-group">
                  <label>Názov oddelenia *</label>
                  <input
                    type="text"
                    value={this.editDepartment.name || ''}
                    onInput={(e) => this.editDepartment = {
                      ...this.editDepartment,
                      name: (e.target as HTMLInputElement).value
                    }}
                    placeholder="Napr. Interné oddelenie"
                  />
                </div>

                <div class="form-group">
                  <label>Popis *</label>
                  <textarea
                    value={this.editDepartment.description || ''}
                    onInput={(e) => this.editDepartment = {
                      ...this.editDepartment,
                      description: (e.target as HTMLTextAreaElement).value
                    }}
                    placeholder="Krátky popis oddelenia"
                    rows={3}
                  ></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Poschodie</label>
                    <input
                      type="number"
                      min="1"
                      value={this.editDepartment.floor || 1}
                      onInput={(e) => this.editDepartment = {
                        ...this.editDepartment,
                        floor: parseInt((e.target as HTMLInputElement).value)
                      }}
                    />
                  </div>

                  <div class="form-group">
                    <label>Maximum lôžok</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={this.editDepartment.capacity?.maximumBeds || 20}
                      onInput={(e) => this.editDepartment = {
                        ...this.editDepartment,
                        capacity: {
                          ...this.editDepartment.capacity,
                          maximumBeds: parseInt((e.target as HTMLInputElement).value) || 20,
                          actualBeds: this.editDepartment.capacity?.actualBeds || 0,
                          occupiedBeds: this.editDepartment.capacity?.occupiedBeds || 0
                        }
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
                  onClick={() => this.handleUpdateDepartment()}
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

