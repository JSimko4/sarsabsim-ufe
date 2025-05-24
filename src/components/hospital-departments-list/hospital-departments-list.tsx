import { Component, h, State, Event, EventEmitter } from '@stencil/core';
import { Department, HospitalDataService } from '../../utils/hospital-data';

@Component({
  tag: 'hospital-departments-list',
  styleUrl: 'hospital-departments-list.css',
  shadow: true,
})
export class HospitalDepartmentsList {
  @State() departments: Department[] = [];
  @State() loading: boolean = true;
  @State() showAddForm: boolean = false;
  @State() showEditForm: boolean = false;
  @State() newDepartment: Partial<Department> = {};
  @State() editDepartment: Partial<Department> = {};
  @State() editingDepartmentId: string = '';

  @Event() navigate: EventEmitter<{id: string}>;

  async componentWillLoad() {
    await this.loadDepartments();
  }

  private async loadDepartments() {
    this.loading = true;
    try {
      this.departments = await HospitalDataService.getDepartments();
    } catch (error) {
      console.error('Error loading departments:', error);
    } finally {
      this.loading = false;
    }
  }

  private handleDepartmentClick(department: Department) {
    this.navigate.emit({ id: department._id });
  }

  private handleEditDepartment(department: Department, event: Event) {
    event.stopPropagation();
    this.editingDepartmentId = department._id;
    this.editDepartment = { ...department };
    this.showEditForm = true;
  }

  private async handleAddDepartment() {
    if (!this.newDepartment.name || !this.newDepartment.description) {
      alert('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      await HospitalDataService.createDepartment({
        name: this.newDepartment.name,
        description: this.newDepartment.description,
        floor: this.newDepartment.floor || 1,
        capacity: {
          maximum_beds: this.newDepartment.capacity?.maximum_beds || 20,
          actual_beds: 0,
          occupied_beds: 0
        }
      });

      this.showAddForm = false;
      this.newDepartment = {};
      await this.loadDepartments();
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
      await HospitalDataService.updateDepartment(this.editingDepartmentId, {
        name: this.editDepartment.name,
        description: this.editDepartment.description,
        floor: this.editDepartment.floor,
        capacity: this.editDepartment.capacity
      });

      this.showEditForm = false;
      this.editDepartment = {};
      this.editingDepartmentId = '';
      await this.loadDepartments();
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
            onClick={() => this.showAddForm = true}
          >
            + Pridať oddelenie
          </button>
        </div>

        <div class="departments-grid">
          {this.departments.map(dept => (
            <div
              key={dept._id}
              class="department-card"
              onClick={() => this.handleDepartmentClick(dept)}
            >
              <div class="department-header">
                <h3>{dept.name}</h3>
                <div class="department-actions">
                  <button
                    class="edit-btn"
                    onClick={(e) => this.handleEditDepartment(dept, e)}
                    title="Upraviť oddelenie"
                  >
                    ✏️
                  </button>
                  <span class="floor-badge">Poschodie {dept.floor}</span>
                </div>
              </div>
              <p class="description">{dept.description}</p>

              <div class="capacity-info">
                <div class="capacity-row">
                  <span>Kapacita lôžok:</span>
                  <span class="capacity-numbers">
                    {dept.capacity.occupied_beds} / {dept.capacity.actual_beds}
                  </span>
                </div>
                <div class="capacity-bar">
                  <div
                    class="capacity-fill"
                    style={{
                      width: `${(dept.capacity.occupied_beds / dept.capacity.actual_beds) * 100 || 0}%`
                    }}
                  ></div>
                </div>
                <div class="capacity-labels">
                  <span class="available">
                    Voľné: {dept.capacity.actual_beds - dept.capacity.occupied_beds}
                  </span>
                  <span class="occupied">
                    Obsadené: {dept.capacity.occupied_beds}
                  </span>
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
                  onClick={() => this.showAddForm = false}
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
                      value={this.newDepartment.capacity?.maximum_beds || 20}
                      onInput={(e) => this.newDepartment = {
                        ...this.newDepartment,
                        capacity: {
                          ...this.newDepartment.capacity,
                          maximum_beds: parseInt((e.target as HTMLInputElement).value) || 20,
                          actual_beds: 0,
                          occupied_beds: 0
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
                  onClick={() => this.showAddForm = false}
                >
                  Zrušiť
                </button>
                <button
                  class="btn-primary"
                  onClick={() => this.handleAddDepartment()}
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
                      value={this.editDepartment.capacity?.maximum_beds || 20}
                      onInput={(e) => this.editDepartment = {
                        ...this.editDepartment,
                        capacity: {
                          ...this.editDepartment.capacity,
                          maximum_beds: parseInt((e.target as HTMLInputElement).value) || 20,
                          actual_beds: this.editDepartment.capacity?.actual_beds || 0,
                          occupied_beds: this.editDepartment.capacity?.occupied_beds || 0
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
