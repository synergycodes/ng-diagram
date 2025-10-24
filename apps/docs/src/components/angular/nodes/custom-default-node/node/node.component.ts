import { Component, input } from '@angular/core';
import {
  type NgDiagramNodeTemplate,
  type Node,
  NgDiagramBaseNodeTemplateComponent,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramBaseNodeTemplateComponent],
  template: `
    <ng-diagram-base-node-template [node]="node">
      <input type="text" [placeholder]="'Enter text'" />
    </ng-diagram-base-node-template>
  `,
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
