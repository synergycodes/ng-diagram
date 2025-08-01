import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgDiagramNodeComponent } from '../ng-diagram-node.component';
import { NgDiagramRotateHandleComponent } from './handle/ng-diagram-rotate-handle.component';

@Component({
  selector: 'ng-diagram-node-rotate-adornment',
  templateUrl: './ng-diagram-node-rotate-adornment.component.html',
  styleUrl: './ng-diagram-node-rotate-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramRotateHandleComponent],
  host: {
    class: 'node-rotate-adornment',
  },
})
export class NgDiagramNodeRotateAdornmentComponent {
  private readonly nodeComponent = inject(NgDiagramNodeComponent);

  readonly nodeData = computed(() => this.nodeComponent.data());
  readonly isRotating = signal(false);
  readonly eventTarget = computed(() => ({ type: 'rotate-handle' as const, element: this.nodeData() }));
  readonly showAdornment = computed(() => !!this.nodeData().selected && this.nodeData().rotatable);
}
