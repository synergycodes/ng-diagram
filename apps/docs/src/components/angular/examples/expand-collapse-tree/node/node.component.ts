import { Component, inject, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { TreeService } from '../tree.service';
import { type TreeNodeData } from '../types';

@Component({
  imports: [NgDiagramPortComponent, NgDiagramBaseNodeTemplateComponent],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'false',
    '[style.visibility]': 'node().data.isHidden ? "hidden" : null',
    '[style.pointer-events]': 'node().data.isHidden ? "none" : null',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<TreeNodeData> {
  private readonly treeService = inject(TreeService);

  node = input.required<Node<TreeNodeData>>();

  onToggle(event: MouseEvent): void {
    event.stopPropagation();
    this.treeService.toggle(this.node().id);
  }
}
