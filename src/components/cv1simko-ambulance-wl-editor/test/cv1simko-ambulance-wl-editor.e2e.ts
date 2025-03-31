import { newE2EPage } from '@stencil/core/testing';

describe('cv1simko-ambulance-wl-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<cv1simko-ambulance-wl-editor></cv1simko-ambulance-wl-editor>');

    const element = await page.find('cv1simko-ambulance-wl-editor');
    expect(element).toHaveClass('hydrated');
  });
});
