import { Component, Host, h, State } from '@stencil/core';

@Component({
  tag: 'sarsabsim-app',
  styleUrl: 'sarsabsim-app.css',
  shadow: true,
})

export class SarsabsimApp {
  @State() currentPage: string = 'departments';
  @State() selectedDepartmentId: string = '';
  @State() selectedBedId: string = '';
  @State() selectedPatientId: string = '';

  navigateTo(page: string, id?: string) {
    this.currentPage = page;
    if (id) {
      if (page === 'department-detail') this.selectedDepartmentId = id;
      if (page === 'bed-detail') this.selectedBedId = id;
      if (page === 'patient-detail') this.selectedPatientId = id;
    }
  }

  render() {
    return (
      <Host>
        <div class="app-container">
          <header class="app-header">
            <h1>Správa lôžkovej časti nemocnice</h1>
            <nav class="main-nav">
              <button
                class={this.currentPage === 'departments' ? 'nav-active' : ''}
                onClick={() => this.navigateTo('departments')}
              >
                Oddelenia
              </button>
              <button
                class={this.currentPage === 'patients' ? 'nav-active' : ''}
                onClick={() => this.navigateTo('patients')}
              >
                Pacienti
              </button>
            </nav>
          </header>

          <main class="app-main">
            {this.renderCurrentPage()}
          </main>
        </div>
      </Host>
    );
  }

  private renderCurrentPage() {
    switch (this.currentPage) {
      case 'departments':
        return <hospital-departments-list onNavigate={(e) => this.navigateTo('department-detail', e.detail.id)} />;

      case 'department-detail':
        return <hospital-department-detail
          departmentId={this.selectedDepartmentId}
          onNavigate={(e) => this.navigateTo(e.detail.page, e.detail.id)}
          onBack={() => this.navigateTo('departments')}
        />;

      case 'bed-detail':
        return <hospital-bed-detail
          bedId={this.selectedBedId}
          onBack={() => this.navigateTo('department-detail', this.selectedDepartmentId)}
        />;

      case 'patients':
        return <hospital-patients-list onNavigate={(e) => this.navigateTo('patient-detail', e.detail.id)} />;

      case 'patient-detail':
        return <hospital-patient-detail
          patientId={this.selectedPatientId}
          onBack={() => this.navigateTo('patients')}
        />;

      default:
        return <div>Stránka nenájdená</div>;
    }
  }
}
