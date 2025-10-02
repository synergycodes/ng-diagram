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
    <div class="node">
      <div class="node-header">Header</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
      </div>

      <!-- Left port for connections -->
      <ng-diagram-port [side]="'left'" [type]="'both'" [id]="'port-left'" />

      <!-- Right port for connections -->
      <ng-diagram-port [side]="'right'" [type]="'both'" [id]="'port-right'" />
    </div>
  `,
  styleUrl: './node.component.scss',
})
// @mark-start
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
// @mark-end
// @section-end
