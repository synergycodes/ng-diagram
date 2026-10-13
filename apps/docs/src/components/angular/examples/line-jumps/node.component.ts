import { Component, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type SimpleNode,
} from 'ng-diagram';

// The base template adds the left and right ports
@Component({
  imports: [NgDiagramPortComponent, NgDiagramBaseNodeTemplateComponent],
  template: `
    <ng-diagram-base-node-template [node]="node()">
      <span class="label">{{ node().data.label }}</span>
    </ng-diagram-base-node-template>
    <ng-diagram-port id="port-top" type="both" side="top" />
    <ng-diagram-port id="port-bottom" type="both" side="bottom" />
  `,
  styles: `
    .label {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 32px;
    }
  `,
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  node = input.required<SimpleNode<{ label: string }>>();
}
