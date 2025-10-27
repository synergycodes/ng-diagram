// @collapse-start
import { Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
// @collapse-end

@Component({
  imports: [NgDiagramNodeResizeAdornmentComponent],
  template: `
    <ng-diagram-node-resize-adornment [defaultResizable]="defaultResizable()">
      <div class="custom-node">
        <div class="custom-node__header">Custom node</div>
      </div>
    </ng-diagram-node-resize-adornment>
  `,
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  styleUrls: ['./node.component.scss'],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node<{ adornmentResizable?: boolean }>>();
  defaultResizable = computed(() => this.node().data['adornmentResizable']);
}
