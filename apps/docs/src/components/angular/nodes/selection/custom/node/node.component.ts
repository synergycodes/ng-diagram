// @section-start
import { Component, input } from '@angular/core';
import { type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

@Component({
  template: `
    <div class="custom-node">
      <div class="custom-node__header">Node title</div>
      <div class="custom-node__content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </div>
    </div>
  `,
  // @mark-start
  host: {
    '[class.custom-selected]': 'isSelected',
  },
  // @mark-end
  styleUrls: ['./node.component.scss'],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();

  // @mark-start
  get isSelected(): boolean {
    return this.node().selected ?? false;
  }
  // @mark-end
}
// @section-end
