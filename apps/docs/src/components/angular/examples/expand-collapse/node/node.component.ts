import { Component, inject, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
import { LayoutService } from '../layout.service';
import { type TreeNodeData } from '../types';

/**
 * Custom tree node template.
 *
 * Renders a labeled node with top/bottom ports for edge connections.
 * When the node has children (`hasChildren` flag), a toggle button is
 * shown to expand or collapse the subtree. Nodes inside a collapsed
 * subtree carry the model-level `hidden` flag, so the library keeps
 * them out of rendering and every interaction — the template needs no
 * visibility handling of its own.
 */
@Component({
  imports: [NgDiagramPortComponent, NgDiagramBaseNodeTemplateComponent],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate<TreeNodeData> {
  private readonly layoutService = inject(LayoutService);

  node = input.required<Node<TreeNodeData>>();

  /** Toggle the collapsed state of this node's subtree and re-layout. */
  onToggle(event: MouseEvent): void {
    // Prevent the click from also selecting/dragging the node.
    event.stopPropagation();
    this.layoutService.toggleCollapsed(this.node().id);
  }
}
