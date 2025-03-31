import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'sarsabsim-app',
  styleUrl: 'sarsabsim-app.css',
  shadow: true,
})

export class SarsabsimApp {
  render() {
    return (
      <Host>
        <span>Hello world - Saraka Sabol Šimko </span>
      </Host>
    );
  }
}
