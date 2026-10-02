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
  type Size,
} from 'ng-diagram';
import { type CollapsibleGroupData, type ReroutedEdgeInfo } from '../types';

/** A partial edge update addressed by edge id. */
type EdgeUpdate = Pick<Edge, 'id'> & Partial<Edge>;

/** A collapsed group shrinks to its header bar. */
const COLLAPSED_SIZE: Size = { width: 200, height: 48 };

/** Size restored on expand when the group had none recorded. */
const DEFAULT_EXPANDED_SIZE: Size = { width: 300, height: 200 };

/** The `source` or `target` end of an edge, pointed at the given node and port. */
function endpointPatch(
  endpoint: 'source' | 'target',
  nodeId: string,
  portId?: string
): Partial<Edge> {
  return endpoint === 'source'
    ? { source: nodeId, sourcePort: portId }
    : { target: nodeId, targetPort: portId };
}

/**
 * Group node that can be collapsed to a header bar and expanded back.
 *
 * Collapsing sets the model `hidden` flag on the direct children of the group
 * and shrinks the group to a header bar. The library does the rest: descendants
 * of a hidden child group and edges connected to hidden nodes disappear
 * automatically, and hidden elements are ignored by hit-testing, selection and
 * zoomToFit bounds. Edges that cross the group boundary are temporarily
 * rerouted to the group node itself, so connections to the outside stay
 * visible while the group is collapsed.
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

  collapsed = computed(() => !!this.node().data.collapsed);
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
    const reroutedEdges = this.findBoundaryEdges(nestedChildIds, groupId);

    this.diagramService.transaction(() => {
      // Hiding the direct children is enough: descendants of a hidden child
      // group and edges connected to hidden nodes are hidden automatically
      // by the library.
      this.modelService.updateNodes(
        directChildren.map(({ id }) => ({ id, hidden: true }))
      );

      // The endpoint inside the group now points at the group itself.
      this.modelService.updateEdges(
        reroutedEdges.map(({ edgeId, endpoint }) => ({
          id: edgeId,
          ...endpointPatch(endpoint, groupId),
        }))
      );

      this.modelService.updateNode(groupId, {
        size: COLLAPSED_SIZE,
        data: {
          ...node.data,
          collapsed: true,
          expandedSize: node.size ?? DEFAULT_EXPANDED_SIZE,
          reroutedEdges,
        },
      });
    });
  }

  /**
   * Expand the group: restore rerouted edges, unhide the direct children,
   * and restore the original size.
   */
  private expandGroup(): void {
    const node = this.node();
    const { expandedSize, reroutedEdges = [], ...data } = node.data;
    const restoreUpdates = this.buildRestoreUpdates(reroutedEdges, node.id);
    const directChildren = this.modelService.getChildren(node.id);

    this.diagramService.transaction(() => {
      this.modelService.updateEdges(restoreUpdates);

      // Unhiding the direct children is enough. A nested group that was
      // collapsed earlier keeps the hidden flags of its own children, so it
      // stays collapsed.
      this.modelService.updateNodes(
        directChildren.map(({ id }) => ({ id, hidden: false }))
      );

      // The data no longer needs expandedSize and reroutedEdges once expanded.
      this.modelService.updateNode(node.id, {
        size: expandedSize ?? DEFAULT_EXPANDED_SIZE,
        data: { ...data, collapsed: false },
      });
    });
  }

  /**
   * Find edges with exactly one endpoint inside the group. That endpoint is
   * pointed at the group while the group is collapsed. Edges fully inside
   * the group need no handling: they are hidden together with their endpoints.
   */
  private findBoundaryEdges(
    childIdSet: Set<string>,
    groupId: string
  ): ReroutedEdgeInfo[] {
    const reroutedEdges: ReroutedEdgeInfo[] = [];

    for (const edge of this.modelService.getModel().getEdges()) {
      const sourceIsChild = childIdSet.has(edge.source);
      const targetIsChild = childIdSet.has(edge.target);
      if (sourceIsChild === targetIsChild) continue;
      // An edge between a child and the group itself would get both endpoints
      // on the group node, so it is skipped.
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

  /**
   * Edge updates that restore the recorded endpoints. An endpoint is restored
   * only when it still points at this group: an outer group may have pointed
   * it at itself in the meantime, and that change must stay until the outer
   * group expands. This keeps collapse and expand correct in any order.
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
      if (edge?.[endpoint] !== groupId) continue;

      updates.push({
        id: edgeId,
        ...endpointPatch(endpoint, originalNodeId, originalPortId),
      });
    }

    return updates;
  }
}
