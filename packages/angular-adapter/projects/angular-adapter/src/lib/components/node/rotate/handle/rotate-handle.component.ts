import { ChangeDetectionStrategy, Component, computed, HostBinding, input, output } from '@angular/core';

@Component({
  selector: 'angular-adapter-rotate-handle',
  template: '',
  styleUrl: './rotate-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'rotate-handle',
    '[style]': 'styles()',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleComponent {
  size = input.required<number>();
  color = input.required<string>();
  backgroundColor = input.required<string>();
  isRotating = input.required<boolean>();
  styles = computed(() => ({
    '--handle-size': `${this.size()}px`,
    '--handle-bg': this.backgroundColor(),
    '--handle-color': this.color(),
  }));

  pointerDownEvent = output<{ event: PointerEvent }>();

  @HostBinding('attr.data-rotating') get pointerDownAttr() {
    return this.isRotating() ? 'true' : null;
  }

  onPointerDown(event: PointerEvent) {
    this.pointerDownEvent.emit({ event });
  }
}
