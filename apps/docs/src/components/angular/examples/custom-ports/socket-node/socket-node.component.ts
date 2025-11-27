import { Component, computed, input } from '@angular/core';
import {
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramPortComponent],
  templateUrl: './socket-node.component.html',
  styleUrls: ['./socket-node.component.scss'],
  host: {
    '[class.ng-diagram-port-hoverable]': 'true',
  },
})
export class SocketNodeComponent implements NgDiagramNodeTemplate<Data> {
  text = computed(() => this.node()?.data?.name || '');
  node = input.required<Node<Data>>();
}

type Data = {
  name: string;
};
