import { Component, computed, inject, input } from '@angular/core';
import {
  NgDiagramBaseNodeTemplateComponent,
  NgDiagramModelService,
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
 * When the node has outgoing edges, a toggle button is shown to expand or
 * collapse the subtree. Nodes inside a collapsed subtree carry the
 * model-level `hidden` flag, so the library keeps them out of rendering
 * and every interaction — the template needs no visibility handling of
 * its own.
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
  private readonly modelService = inject(NgDiagramModelService);

  node = input.required<Node<TreeNodeData>>();

  /** Whether the node has children, derived from its outgoing edges. */
  hasChildren = computed(() => {
    // getConnectedEdges() is not signal-based; read edges() first so this
    // computed re-evaluates when the user draws or deletes edges.
    this.modelService.edges();
    const id = this.node().id;
    return this.modelService
      .getConnectedEdges(id)
      .some((edge) => edge.source === id);
  });

  /** Toggle the collapsed state of this node's subtree and re-layout. */
  onToggle(): void {
    this.layoutService.toggleCollapsed(this.node().id);
  }
}
