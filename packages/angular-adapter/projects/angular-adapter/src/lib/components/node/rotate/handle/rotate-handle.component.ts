import { ChangeDetectionStrategy, Component, computed, HostBinding, inject, input, output } from '@angular/core';
import { RotateHandleConfiguration } from '@angularflow/core';
import { FlowCoreProviderService } from '../../../../services';
import { ROTATE_HANDLER_RIGHT_OFFSET, ROTATE_HANDLER_TOP_OFFSET } from '../constants';

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
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  metadata = this.getMetadata();

  computedOffset = computed(() => {
    const current = this.metadata['rotateHandleOffset'] as RotateHandleConfiguration;
    return {
      top: current?.top ?? ROTATE_HANDLER_TOP_OFFSET,
      right: current?.right ?? ROTATE_HANDLER_RIGHT_OFFSET,
      bottom: current?.bottom,
      left: current?.left,
    };
  });

  pointerDownEvent = output<{ event: PointerEvent }>();

  @HostBinding('attr.data-rotating') get pointerDownAttr() {
    return this.isRotating() ? 'true' : null;
  }

  onPointerDown(event: PointerEvent) {
    this.pointerDownEvent.emit({ event });
  }

  private formatPositionValue(value?: string | number | null): string | null {
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

  private getMetadata() {
    return this.flowCoreProvider.provide().getState().metadata;
  }
}
