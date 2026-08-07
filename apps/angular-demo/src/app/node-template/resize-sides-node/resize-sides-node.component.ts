import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  Node,
  type Side,
} from 'ng-diagram';

export interface ResizeSidesNodeData {
  label: string;
  activeSides: Side[];
}

/**
 * Test bed for the adornment's `activeSides` input: the node passes through whatever its data lists,
 * so the model can line up one node per case (all four, adjacent, opposite, single, none).
 */
@Component({
  selector: 'app-resize-sides-node',
  imports: [DecimalPipe, NgDiagramNodeResizeAdornmentComponent],
  templateUrl: './resize-sides-node.component.html',
  styleUrls: ['./resize-sides-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
})
export class ResizeSidesNodeComponent implements NgDiagramNodeTemplate<ResizeSidesNodeData> {
  node = input.required<Node<ResizeSidesNodeData>>();

  readonly label = computed(() => this.node().data?.label ?? '');
  readonly activeSides = computed(() => this.node().data?.activeSides ?? []);
  readonly sidesText = computed(() => {
    const sides = this.activeSides();
    return sides.length ? sides.join(' + ') : 'none';
  });
}
