import { Component, input } from '@angular/core';
import {
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'node',
  imports: [NgDiagramNodeRotateAdornmentComponent],
  template: `
    <ng-diagram-node-rotate-adornment />
    <div class="node">
      <div class="node-header">Header</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
    </div>
  `,
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
        display: flex;
        .node {
          width: 200px;
          height: 100px;
          border: 1px solid #ccc;
          padding: 10px;
        }
        .node-header {
          font-size: 20px;
          background-color: #f5f5f5;
        }
        .node-content {
          font-size: 14px;
        }
      }
    `,
  ],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
