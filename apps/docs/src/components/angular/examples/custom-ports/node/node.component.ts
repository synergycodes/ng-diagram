import { Component, input, model } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'node',
  imports: [NgDiagramPortComponent],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate {
  text = model<string>('');
  node = input.required<Node<{ name: string; cssClass: string }>>();
}
