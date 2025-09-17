import { Component, input } from '@angular/core';
import {
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  selector: 'node',
  imports: [NgDiagramPortComponent],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
  template: `
    <div class="node">
      <div class="node-header">Header</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
    </div>
    <ng-diagram-port id="port-left" type="both" side="left" />
    <ng-diagram-port id="port-top" type="both" side="top" />
    <ng-diagram-port id="port-right" type="both" side="right" />
    <ng-diagram-port id="port-bottom" type="both" side="bottom" />
  `,
  styleUrl: './node.component.scss',
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
