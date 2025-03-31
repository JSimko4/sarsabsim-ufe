import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { AmbulanceWaitingListApi, WaitingListEntry, Configuration } from '../../api/ambulance-wl';

@Component({
  tag: 'cv1simko-ambulance-wl-list',
  styleUrl: 'cv1simko-ambulance-wl-list.css',
  shadow: true,
})
export class Cv1simkoAmbulanceWlList {
  @Event({ eventName: "entry-clicked"}) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() ambulanceId: string;
  @State() errorMessage: string;

  waitingPatients: any[];

  private async getWaitingPatientsAsync(){
    // be prepared for connectivitiy issues
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const waitingListApi = new AmbulanceWaitingListApi(configuration);
      const response = await waitingListApi.getWaitingListEntriesRaw({ambulanceId: this.ambulanceId})
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        this.errorMessage = `Cannot retrieve list of waiting patients: ${response.raw.statusText}`
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve list of waiting patients: ${err.message || "unknown"}`
    }
    return [];
  }

  async componentWillLoad() {
    this.waitingPatients = await this.getWaitingPatientsAsync();
  }

  render() {
    return (
      <Host>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          :
        <md-list>
        {this.waitingPatients.map((patient) =>
            <md-list-item onClick={ () => this.entryClicked.emit(patient.id)}>
              <div slot="headline">{patient.name}</div>
              <div slot="supporting-text">{"Predpokladaný vstup: " + patient.estimatedStart?.toLocaleString()}</div>
              <md-icon slot="start">person</md-icon>
            </md-list-item>
          )}
        </md-list>
        }
            <md-filled-icon-button class="add-button"
      onclick={() => this.entryClicked.emit("@new")}>
      <md-icon>add</md-icon>
    </md-filled-icon-button>
      </Host>
    );
  }
}
