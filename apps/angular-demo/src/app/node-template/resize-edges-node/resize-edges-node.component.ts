import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  Node,
  type ResizeEdge,
} from 'ng-diagram';

export interface ResizeEdgesNodeData {
  label: string;
  resizeEdges: ResizeEdge[];
}

/**
 * Test bed for the adornment's `resizeEdges` input: the node passes through whatever its data lists,
 * so the model can line up one node per case (all four, adjacent, opposite, single, none).
 */
@Component({
  selector: 'app-resize-edges-node',
  imports: [DecimalPipe, NgDiagramNodeResizeAdornmentComponent],
  templateUrl: './resize-edges-node.component.html',
  styleUrls: ['./resize-edges-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
})
export class ResizeEdgesNodeComponent implements NgDiagramNodeTemplate<ResizeEdgesNodeData> {
  node = input.required<Node<ResizeEdgesNodeData>>();

  readonly label = computed(() => this.node().data?.label ?? '');
  readonly resizeEdges = computed(() => this.node().data?.resizeEdges ?? []);
  readonly edgesText = computed(() => {
    const edges = this.resizeEdges();
    return edges.length ? edges.join(' + ') : 'none';
  });
}
