import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { HandlePosition } from '../node-resize-adornment.types';

@Component({
  selector: 'angular-adapter-resize-handle',
  template: '',
  styleUrl: './resize-handle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '(pointerdown)': 'pointerEvent.emit({ event: $event, position: position() })',
    '(pointerup)': 'pointerEvent.emit({ event: $event, position: position() })',
  },
})
export class ResizeHandleComponent {
  position = input.required<HandlePosition>();
  classes = computed(() => `resize-handle resize-handle--${this.position()}`);

  pointerEvent = output<{ event: PointerEvent; position: HandlePosition }>();
}
