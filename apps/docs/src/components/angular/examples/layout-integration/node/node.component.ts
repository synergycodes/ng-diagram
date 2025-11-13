import { Component, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramPortComponent, NgDiagramBaseNodeTemplateComponent],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node>();
}
