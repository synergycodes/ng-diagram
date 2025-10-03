import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NodeContextGuardBase } from '../../../utils/node-context-guard.base';
import { NgDiagramRotateHandleComponent } from './handle/ng-diagram-rotate-handle.component';

/**
 * The `NgDiagramNodeRotateAdornmentComponent` displays a rotation handle for a selected, rotatable node.
 *
 * ## Example usage
 * ```html
 * <ng-diagram-node-rotate-adornment />
 * <!-- Add your node content here -->
 * ```
 *
 * @category Components
 */
@Component({
  selector: 'ng-diagram-node-rotate-adornment',
  standalone: true,
  templateUrl: './ng-diagram-node-rotate-adornment.component.html',
  styleUrl: './ng-diagram-node-rotate-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramRotateHandleComponent],
  host: {
    class: 'node-rotate-adornment',
  },
})
export class NgDiagramNodeRotateAdornmentComponent extends NodeContextGuardBase {
  readonly isRotating = signal(false);
  readonly nodeData = computed(() => this.nodeComponent?.node());
  readonly eventTarget = computed(() => ({ type: 'rotate-handle' as const, element: this.nodeData() }));
  readonly showAdornment = computed(
    () => !!this.nodeData()?.selected && this.nodeData()?.rotatable && this.isRenderedOnCanvas()
  );
}
