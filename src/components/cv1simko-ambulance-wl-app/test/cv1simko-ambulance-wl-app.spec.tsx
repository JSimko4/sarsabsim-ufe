import { newSpecPage } from '@stencil/core/testing';
import { Cv1simkoAmbulanceWlApp } from '../cv1simko-ambulance-wl-app';

describe('cv1simko-ambulance-wl-app', () => {

  it('renders editor', async () => {
    const page = await newSpecPage({
      url: `http://localhost/entry/@new`,
      components: [Cv1simkoAmbulanceWlApp],
      html: `<cv1simko-ambulance-wl-app base-path="/"></cv1simko-ambulance-wl-app>`,
    });
    page.win.navigation = new EventTarget()
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual ("cv1simko-ambulance-wl-editor");

  });

  it('renders list', async () => {
    const page = await newSpecPage({
      url: `http://localhost/ambulance-wl/`,
      components: [Cv1simkoAmbulanceWlApp],
      html: `<cv1simko-ambulance-wl-app base-path="/ambulance-wl/"></cv1simko-ambulance-wl-app>`,
    });
    page.win.navigation = new EventTarget()
    const child = await page.root.shadowRoot.firstElementChild;
    expect(child.tagName.toLocaleLowerCase()).toEqual("cv1simko-ambulance-wl-list");
  });
});
