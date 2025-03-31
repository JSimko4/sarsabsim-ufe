import { newE2EPage } from '@stencil/core/testing';

describe('cv1simko-ambulance-wl-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<cv1simko-ambulance-wl-list></cv1simko-ambulance-wl-list>');

    const element = await page.find('cv1simko-ambulance-wl-list');
    expect(element).toHaveClass('hydrated');
  });
});
