import { Component, h, State, Event, EventEmitter, Prop } from '@stencil/core';
import { HospitalApiService } from '../../utils/hospital-api-service';
import { Department } from '../../api/hospital-management';

@Component({
  tag: 'hospital-departments-list',
  styleUrl: 'hospital-departments-list.css',
  shadow: true,
})
export class HospitalDepartmentsList {
  @Prop() apiBase: string;
  @State() departments: Department[] = [];
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
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      this.loading = false;
    }
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
      await this.hospitalApiService.updateDepartment(this.editingDepartmentId, {
        name: this.editDepartment.name,
        description: this.editDepartment.description,
        floor: this.editDepartment.floor,
        capacity: this.editDepartment.capacity
      });

      this.showEditForm = false;
      this.editDepartment = {};
      this.editingDepartmentId = '';
      await this.loadData();
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Chyba pri aktualizácii oddelenia');
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
                  <span class="value">{dept.capacity.occupiedBeds}/{dept.capacity.actualBeds}</span>
                </div>
                <div class="capacity-bar">
                  <div
                    class="capacity-fill"
                    style={{width: `${(dept.capacity.occupiedBeds / dept.capacity.actualBeds) * 100}%`}}
                  ></div>
                </div>
                <div class="capacity-text">
                  {dept.capacity.actualBeds - dept.capacity.occupiedBeds} voľných lôžok
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

