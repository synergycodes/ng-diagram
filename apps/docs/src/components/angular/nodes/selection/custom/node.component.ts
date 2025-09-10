import { Component, input } from '@angular/core';
import {
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

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
  host: {
    '[class.custom-selected]': 'isSelected',
  },
  styleUrls: ['./node.component.scss'],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();

  get isSelected(): boolean {
    return this.node().selected ?? false;
  }
}
