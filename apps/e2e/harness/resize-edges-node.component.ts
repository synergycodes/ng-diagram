import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  type NgDiagramNodeTemplate,
  type Node,
  type ResizeEdge,
} from 'ng-diagram';

export interface ResizeEdgesNodeData {
  label: string;
  resizeEdges: ResizeEdge[];
}

/** Passes `data.resizeEdges` straight into the adornment, so a model can line up one node per case. */
@Component({
  selector: 'harness-resize-edges-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramNodeResizeAdornmentComponent],
  template: `
    <ng-diagram-node-resize-adornment [resizeEdges]="resizeEdges()">
      <div class="resize-edges-node">{{ label() }}</div>
    </ng-diagram-node-resize-adornment>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .resize-edges-node {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        background: #fff;
        border: 1px solid #ccc;
        padding: 8px;
      }
    `,
  ],
})
export class ResizeEdgesNodeComponent implements NgDiagramNodeTemplate<ResizeEdgesNodeData> {
  node = input.required<Node<ResizeEdgesNodeData>>();

  readonly label = computed(() => this.node().data?.label ?? '');
  readonly resizeEdges = computed(() => this.node().data?.resizeEdges ?? []);
}
