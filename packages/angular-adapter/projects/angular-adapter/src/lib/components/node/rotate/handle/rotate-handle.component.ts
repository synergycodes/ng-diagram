import { ChangeDetectionStrategy, Component, HostBinding, input, output } from '@angular/core';

@Component({
  selector: 'angular-adapter-rotate-handle',
  template: '',
  styleUrl: './rotate-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'node-rotate-handle',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleComponent {
  isRotating = input.required<boolean>();

  pointerDownEvent = output<{ event: PointerEvent }>();

  @HostBinding('attr.data-rotating') get pointerDownAttr() {
    return this.isRotating() ? 'true' : null;
  }

  onPointerDown(event: PointerEvent) {
    this.pointerDownEvent.emit({ event });
  }
}
