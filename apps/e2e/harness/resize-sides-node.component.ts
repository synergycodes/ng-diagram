import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgDiagramNodeResizeAdornmentComponent, type NgDiagramNodeTemplate, type Node, type Side } from 'ng-diagram';

export interface ResizeSidesNodeData {
  label: string;
  activeSides: Side[];
}

/** Passes `data.activeSides` straight into the adornment, so a model can line up one node per case. */
@Component({
  selector: 'harness-resize-sides-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramNodeResizeAdornmentComponent],
  template: `
    <ng-diagram-node-resize-adornment [activeSides]="activeSides()">
      <div class="resize-sides-node">{{ label() }}</div>
    </ng-diagram-node-resize-adornment>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .resize-sides-node {
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
export class ResizeSidesNodeComponent implements NgDiagramNodeTemplate<ResizeSidesNodeData> {
  node = input.required<Node<ResizeSidesNodeData>>();

  readonly label = computed(() => this.node().data?.label ?? '');
  readonly activeSides = computed(() => this.node().data?.activeSides ?? []);
}
