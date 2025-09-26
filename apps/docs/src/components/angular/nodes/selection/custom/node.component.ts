// @collapse-start
import { Component, input } from '@angular/core';
import { type NgDiagramNodeTemplate, type Node } from 'ng-diagram';
// @collapse-end

@Component({
  selector: 'node',
  template: `
    <div class="node">
      <div class="node-header">Header {{ node().data.label }}</div>
      <div class="node-content">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
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
