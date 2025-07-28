import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AngularAdapterNodeComponent } from '../angular-adapter-node.component';
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
  private readonly nodeComponent = inject(AngularAdapterNodeComponent);

  readonly nodeData = computed(() => this.nodeComponent.data());
  readonly isRotating = signal(false);
  readonly eventTarget = computed(() => ({ type: 'rotate-handle' as const, element: this.nodeData() }));
  readonly showAdornment = computed(() => !!this.nodeData().selected && this.nodeData().rotatable);
}
