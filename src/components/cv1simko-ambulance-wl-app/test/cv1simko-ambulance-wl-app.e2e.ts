import { newE2EPage } from '@stencil/core/testing';

describe('cv1simko-ambulance-wl-app', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<cv1simko-ambulance-wl-app></cv1simko-ambulance-wl-app>');

    const element = await page.find('cv1simko-ambulance-wl-app');
    expect(element).toHaveClass('hydrated');
  });
});
