import { Component, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { type SimpleNodeData } from '../../types';

/**
 * Simple leaf node that displays a label. When its group collapses, the
 * library hides it via the model-level `hidden` flag — the template needs
 * no visibility handling of its own.
 */
@Component({
  imports: [NgDiagramBaseNodeTemplateComponent],
  templateUrl: './simple-node.component.html',
  styleUrls: ['./simple-node.component.scss'],
})
export class SimpleNodeComponent implements NgDiagramNodeTemplate<SimpleNodeData> {
  node = input.required<Node<SimpleNodeData>>();
}
