import { Component, input, model } from '@angular/core';
import {
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramPortComponent],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
})
export class NodeComponent implements NgDiagramNodeTemplate<Data> {
  text = model<string>('');
  node = input.required<Node<Data>>();
}

type Data = {
  name: string;
  leftPortColor: string;
};
