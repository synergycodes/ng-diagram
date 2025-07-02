import { ChangeDetectionStrategy, Component, computed, HostBinding, input, output } from '@angular/core';

@Component({
  selector: 'angular-adapter-rotate-handle',
  template: '',
  standalone: true,
  styleUrl: './rotate-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'node-rotate-handle',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleComponent {
  isRotating = input.required<boolean>();

  offset = input<{
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
  }>();

  computedOffset = computed(() => {
    const current = this.offset() ?? {};
    return {
      top: current.top ?? -20,
      right: current.right ?? -36,
      bottom: current.bottom,
      left: current.left,
    };
  });

  pointerDownEvent = output<{ event: PointerEvent }>();

  @HostBinding('attr.data-rotating') get pointerDownAttr() {
    return this.isRotating() ? 'true' : null;
  }

  onPointerDown(event: PointerEvent) {
    this.pointerDownEvent.emit({ event });
  }

  private formatPositionValue(value?: string | number): string | null {
    return value == null ? null : typeof value === 'number' ? `${value}px` : value;
  }

  @HostBinding('style.top') get styleTop() {
    return this.formatPositionValue(this.computedOffset().top);
  }

  @HostBinding('style.left') get styleLeft() {
    return this.formatPositionValue(this.computedOffset().left);
  }

  @HostBinding('style.right') get styleRight() {
    return this.formatPositionValue(this.computedOffset().right);
  }

  @HostBinding('style.bottom') get styleBottom() {
    return this.formatPositionValue(this.computedOffset().bottom);
  }
}
