import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  NgDiagramGroupHighlightedDirective,
  NgDiagramModelService,
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramService,
  type Edge,
  type GroupNode,
  type NgDiagramGroupNodeTemplate,
} from 'ng-diagram';
import { type CollapsibleGroupData, type ReroutedEdgeInfo } from '../../types';

/** A partial edge update addressed by edge id. */
type EdgeUpdate = Pick<Edge, 'id'> & Partial<Edge>;

/**
 * Group node that can be collapsed into a compact representation and expanded back.
 *
 * Collapsing sets the model-level `hidden` flag on the group's direct children
 * and shrinks the group to a header bar. The library's effective-visibility
 * cascade does the rest: descendants of a hidden child group and edges touching
 * hidden nodes disappear automatically, and hidden elements are excluded from
 * hit-testing, selection and zoomToFit bounds. Edges crossing the group
 * boundary are temporarily rerouted to the group node itself so external
 * connections stay visible while collapsed.
 */
@Component({
  selector: 'app-collapsible-group-node',
  imports: [
    NgDiagramNodeResizeAdornmentComponent,
    NgDiagramNodeSelectedDirective,
    NgDiagramGroupHighlightedDirective,
  ],
  templateUrl: './collapsible-group-node.component.html',
  styleUrls: ['./collapsible-group-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsibleGroupNodeComponent implements NgDiagramGroupNodeTemplate<CollapsibleGroupData> {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly diagramService = inject(NgDiagramService);

  node = input.required<GroupNode<CollapsibleGroupData>>();

  groupTitle = computed(() => this.node().data?.title ?? 'Group');
  collapsed = computed(() => this.node().data?.collapsed ?? false);
  childCount = computed(() => {
    // getChildrenNested() is not signal-based; read nodes() first so this
    // computed re-evaluates when the model changes.
    this.modelService.nodes();
    return this.modelService.getChildrenNested(this.node().id).length;
  });

  /** Toggle between collapsed and expanded states. */
  toggleCollapse(): void {
    if (this.collapsed()) {
      this.expandGroup();
    } else {
      this.collapseGroup();
    }
  }

  /**
   * Collapse the group: hide its direct children, reroute boundary-crossing
   * edges to the group, and shrink the group to its header.
   */
  private collapseGroup(): void {
    const node = this.node();
    const groupId = node.id;
    const directChildren = this.modelService.getChildren(groupId);
    const nestedChildIds = new Set(
      this.modelService.getChildrenNested(groupId).map((child) => child.id)
    );

    const expandedSize = node.size
      ? { width: node.size.width, height: node.size.height }
      : { width: 300, height: 200 };

    const reroutedEdges = this.findBoundaryEdges(nestedChildIds, groupId);

    this.diagramService.transaction(() => {
      // Hiding the direct children is enough: descendants of a hidden child
      // group and edges connected to hidden nodes are hidden automatically
      // by the effective-visibility cascade.
      this.modelService.updateNodes(
        directChildren.map(({ id }) => ({ id, hidden: true }))
      );

      if (reroutedEdges.length > 0) {
        this.modelService.updateEdges(
          this.buildRerouteUpdates(reroutedEdges, groupId)
        );
      }

      this.modelService.updateNode(groupId, {
        size: { width: 200, height: 48 },
        data: { ...node.data, collapsed: true, expandedSize, reroutedEdges },
      });
    });
  }

  /**
   * Expand the group: restore rerouted edges, unhide the direct children,
   * and restore the original size.
   */
  private expandGroup(): void {
    const node = this.node();
    const data = node.data;
    const expandedSize = data?.expandedSize ?? { width: 300, height: 200 };
    const restoreUpdates = this.buildRestoreUpdates(
      data?.reroutedEdges ?? [],
      node.id
    );
    const directChildren = this.modelService.getChildren(node.id);

    this.diagramService.transaction(() => {
      if (restoreUpdates.length > 0) {
        this.modelService.updateEdges(restoreUpdates);
      }

      // Unhiding the direct children is enough. A nested group that was
      // collapsed before this group keeps its own children's hidden flags,
      // so its collapsed state survives the round trip.
      this.modelService.updateNodes(
        directChildren.map(({ id }) => ({ id, hidden: false }))
      );

      this.modelService.updateNode(node.id, {
        size: expandedSize,
        data: {
          ...data,
          collapsed: false,
          expandedSize: undefined,
          reroutedEdges: undefined,
        },
      });
    });
  }

  /**
   * Find edges with exactly one endpoint inside the group — that endpoint is
   * redirected to the group boundary while the group is collapsed. Edges
   * fully inside the group need no handling: they hide with their endpoints.
   */
  private findBoundaryEdges(
    childIdSet: Set<string>,
    groupId: string
  ): ReroutedEdgeInfo[] {
    const reroutedEdges: ReroutedEdgeInfo[] = [];

    for (const edge of this.collectUniqueEdges(childIdSet)) {
      const sourceIsChild = childIdSet.has(edge.source);
      const targetIsChild = childIdSet.has(edge.target);
      if (sourceIsChild === targetIsChild) continue;
      // An edge between a child and the group itself would end up with both
      // endpoints on the group node — leave it alone.
      if (edge.source === groupId || edge.target === groupId) continue;

      reroutedEdges.push(
        sourceIsChild
          ? {
              edgeId: edge.id,
              endpoint: 'source',
              originalNodeId: edge.source,
              originalPortId: edge.sourcePort,
            }
          : {
              edgeId: edge.id,
              endpoint: 'target',
              originalNodeId: edge.target,
              originalPortId: edge.targetPort,
            }
      );
    }

    return reroutedEdges;
  }

  /** Partial edge updates that point each recorded endpoint at the group node. */
  private buildRerouteUpdates(
    reroutedEdges: ReroutedEdgeInfo[],
    groupId: string
  ): EdgeUpdate[] {
    return reroutedEdges.map(({ edgeId, endpoint }) =>
      endpoint === 'source'
        ? { id: edgeId, source: groupId, sourcePort: undefined }
        : { id: edgeId, target: groupId, targetPort: undefined }
    );
  }

  /**
   * Partial edge updates that restore the recorded endpoints. Only an
   * endpoint that still points at this group is restored: a sibling or outer
   * group may have redirected the edge's other endpoint to itself in the
   * meantime, and that reroute must stay until its own group expands. This
   * keeps collapse/expand correct in any order.
   */
  private buildRestoreUpdates(
    reroutedEdges: ReroutedEdgeInfo[],
    groupId: string
  ): EdgeUpdate[] {
    const updates: EdgeUpdate[] = [];

    for (const {
      edgeId,
      endpoint,
      originalNodeId,
      originalPortId,
    } of reroutedEdges) {
      const edge = this.modelService.getEdgeById(edgeId);
      if (!edge) continue;

      if (endpoint === 'source' && edge.source === groupId) {
        updates.push({
          id: edgeId,
          source: originalNodeId,
          sourcePort: originalPortId,
        });
      } else if (endpoint === 'target' && edge.target === groupId) {
        updates.push({
          id: edgeId,
          target: originalNodeId,
          targetPort: originalPortId,
        });
      }
    }

    return updates;
  }

  /** Deduplicated list of all edges connected to any of the given nodes. */
  private collectUniqueEdges(nodeIds: Set<string>): Edge[] {
    const seen = new Set<string>();
    const edges: Edge[] = [];
    for (const nodeId of nodeIds) {
      for (const edge of this.modelService.getConnectedEdges(nodeId)) {
        if (seen.has(edge.id)) continue;
        seen.add(edge.id);
        edges.push(edge);
      }
    }
    return edges;
  }
}
