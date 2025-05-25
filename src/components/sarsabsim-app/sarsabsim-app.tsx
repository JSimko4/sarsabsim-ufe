import { Component, h, State, Prop } from '@stencil/core';

@Component({
  tag: 'sarsabsim-app',
  styleUrl: 'sarsabsim-app.css',
  shadow: true,
})
export class SarsabsimApp {
  @Prop() apiBase: string;
  @State() currentView: string = 'departments';
  @State() selectedDepartmentId: string = '';
  @State() selectedBedId: string = '';
  @State() selectedPatientId: string = '';

  private handleNavigateToDepartments() {
    this.currentView = 'departments';
    this.selectedDepartmentId = '';
    this.selectedBedId = '';
    this.selectedPatientId = '';
  }

  private handleNavigateToPatients() {
    this.currentView = 'patients';
    this.selectedDepartmentId = '';
    this.selectedBedId = '';
    this.selectedPatientId = '';
  }

  private handleDepartmentSelected(departmentId: string) {
    this.selectedDepartmentId = departmentId;
    this.currentView = 'department-detail';
  }

  private handleBedSelected(bedId: string) {
    this.selectedBedId = bedId;
    this.currentView = 'bed-detail';
  }

  private handlePatientSelected(patientId: string) {
    this.selectedPatientId = patientId;
    this.currentView = 'patient-detail';
  }

  private handleBackToDepartments() {
    this.currentView = 'departments';
    this.selectedDepartmentId = '';
    this.selectedBedId = '';
  }

  private handleBackToDepartmentDetail() {
    this.currentView = 'department-detail';
    this.selectedBedId = '';
  }

  private handleBackToPatients() {
    this.currentView = 'patients';
    this.selectedPatientId = '';
  }

  render() {
    return (
      <div class="app-container">
        <header class="app-header">
          <h1>Nemocničný systém</h1>
          <nav class="app-nav">
            <button
              class={this.currentView.includes('department') ? 'nav-btn active' : 'nav-btn'}
              onClick={() => this.handleNavigateToDepartments()}
            >
              Oddelenia
            </button>
            <button
              class={this.currentView.includes('patient') ? 'nav-btn active' : 'nav-btn'}
              onClick={() => this.handleNavigateToPatients()}
            >
              Pacienti
            </button>
          </nav>
        </header>

        <main class="app-main">
          {this.currentView === 'departments' && (
            <hospital-departments-list
              api-base={this.apiBase}
              onDepartmentSelected={(e) => this.handleDepartmentSelected(e.detail)}
            />
          )}

          {this.currentView === 'department-detail' && (
            <hospital-department-detail
              api-base={this.apiBase}
              departmentId={this.selectedDepartmentId}
              onBack={() => this.handleBackToDepartments()}
              onBedSelected={(e) => this.handleBedSelected(e.detail)}
            />
          )}

          {this.currentView === 'bed-detail' && (
            <hospital-bed-detail
              api-base={this.apiBase}
              bedId={this.selectedBedId}
              onBack={() => this.handleBackToDepartmentDetail()}
            />
          )}

          {this.currentView === 'patients' && (
            <hospital-patients-list
              api-base={this.apiBase}
              onPatientSelected={(e) => this.handlePatientSelected(e.detail)}
            />
          )}

          {this.currentView === 'patient-detail' && (
            <hospital-patient-detail
              api-base={this.apiBase}
              patientId={this.selectedPatientId}
              onBack={() => this.handleBackToPatients()}
            />
          )}
        </main>
      </div>
    );
  }
}
