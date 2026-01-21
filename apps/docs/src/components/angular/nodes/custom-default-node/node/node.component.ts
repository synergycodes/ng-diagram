import { Component, input } from '@angular/core';
import {
  type NgDiagramNodeTemplate,
  type Node,
  NgDiagramBaseNodeTemplateComponent,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramBaseNodeTemplateComponent],
  template: `
    <ng-diagram-base-node-template [node]="node()">
      <input
        type="text"
        [placeholder]="'Enter text'"
        [attr.data-no-drag]="true"
        [attr.data-no-pan]="true"
      />
    </ng-diagram-base-node-template>
  `,
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
