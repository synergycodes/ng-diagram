import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hello',
  standalone: true,
  template: `
    <p>Hello from Angular!!</p>

    @if (show) {
      <p>{{ helpText }}</p>
    }

    <button (click)="toggle()">Toggle</button>
  `,
})
export class HelloComponent {
  @Input() helpText = 'help';

  show = false;

  toggle() {
    this.show = !this.show;
  }
}
