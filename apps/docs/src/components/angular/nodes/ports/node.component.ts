import { Component, input } from '@angular/core';
import {
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

// @section-start registering
// @section-start usage
@Component({
  // @collapse-start usage
  selector: 'node',
  imports: [NgDiagramPortComponent],
  // @mark-start registering
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
  // @collapse-end usage
  // @mark-end registering
  // @collapse-start registering
  template: `
    <div class="node">
      <div class="node-header">Header</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>
    </div>
    <!-- @mark-start usage -->
    <ng-diagram-port id="port-left" type="both" side="left" />
    <ng-diagram-port id="port-top" type="both" side="top" />
    <ng-diagram-port id="port-right" type="both" side="right" />
    <ng-diagram-port id="port-bottom" type="both" side="bottom" />
    <!-- @mark-end usage -->
  `,
  styleUrl: './node.component.scss',
  // @collapse-end registering
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
// @section-end registering
// @section-end usage
