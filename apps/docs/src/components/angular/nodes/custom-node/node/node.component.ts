import { Component, input } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  type Node,
} from 'ng-diagram';

// @section-start
@Component({
  imports: [NgDiagramPortComponent],
  // Add selection directive to automatically apply selection styles.
  // Note: The host element must have display: block or flex for selection box-shadow to render properly
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  template: `
    <div class="custom-node">
      <div class="custom-node__header">Node title</div>
      <div class="custom-node__content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </div>
    </div>
    <!-- Left port for connections -->
    <ng-diagram-port [side]="'left'" [type]="'both'" [id]="'port-left'" />
    <!-- Right port for connections -->
    <ng-diagram-port [side]="'right'" [type]="'both'" [id]="'port-right'" />
  `,
  styleUrl: './node.component.scss',
})
// @mark-start
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
// @mark-end
// @section-end
