import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Node } from '@angularflow/core';
import { RotateHandleComponent } from './handle/rotate-handle.component';

@Component({
  selector: 'angular-adapter-node-rotate-adornment',
  templateUrl: './node-rotate-adornment.component.html',
  styleUrl: './node-rotate-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RotateHandleComponent],
  host: {
    class: 'node-rotate-adornment',
  },
})
export class NodeRotateAdornmentComponent {
  readonly isRotating = signal(false);
  readonly data = input.required<Node>();
  readonly eventTarget = computed(() => ({ type: 'rotate-handle' as const, element: this.data() }));
  readonly showAdornment = computed(() => !!this.data().selected && this.data().rotatable);
}
