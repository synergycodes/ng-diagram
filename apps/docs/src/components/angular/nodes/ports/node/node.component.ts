// @section-start:hover-style
// @section-start:usage
import { Component, input } from '@angular/core';
import {
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  // @collapse-start:usage
  imports: [NgDiagramPortComponent],
  // @mark-start:hover-style
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
  // @collapse-end:usage
  // @mark-end:hover-style
  // @collapse-start:hover-style
  template: `
    <div class="custom-node">
      <div class="custom-node__header">{{ node().data.label }}</div>
      <div class="custom-node__content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </div>
    </div>
    <!-- @mark-start:usage -->
    <ng-diagram-port id="port-left" type="both" side="left" />
    <ng-diagram-port id="port-top" type="both" side="top" />
    <ng-diagram-port id="port-right" type="both" side="right" />
    <ng-diagram-port id="port-bottom" type="both" side="bottom" />
    <!-- @mark-end:usage -->
  `,
  styleUrl: './node.component.scss',
  // @collapse-end:hover-style
})
export class CustomNodeComponent
  implements NgDiagramNodeTemplate<{ label: string }>
{
  node = input.required<Node<{ label: string }>>();
}
// @section-end:hover-style
// @section-end:usage
