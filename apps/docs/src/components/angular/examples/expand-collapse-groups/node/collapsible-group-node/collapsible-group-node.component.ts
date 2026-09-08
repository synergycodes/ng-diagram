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
          this.buildRerouteUpdates(reroutedEdges, nestedChildIds, groupId)
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
    const reroutedEdges = data?.reroutedEdges ?? [];
    const directChildren = this.modelService.getChildren(node.id);

    this.diagramService.transaction(() => {
      if (reroutedEdges.length > 0) {
        this.modelService.updateEdges(
          reroutedEdges.map((info) => ({
            id: info.edgeId,
            ...info.originalProps,
          }))
        );
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
   * Find edges with exactly one endpoint inside the group — these are
   * rerouted to the group boundary while it is collapsed. Edges fully
   * inside the group need no handling: they hide with their endpoints.
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

      const newSource = sourceIsChild ? groupId : edge.source;
      const newTarget = targetIsChild ? groupId : edge.target;
      if (newSource === newTarget) continue;

      reroutedEdges.push({
        edgeId: edge.id,
        originalProps: {
          source: edge.source,
          target: edge.target,
          sourcePort: edge.sourcePort,
          targetPort: edge.targetPort,
        },
      });
    }

    return reroutedEdges;
  }

  /**
   * Build partial edge updates that reroute boundary-crossing
   * edges to the group node.
   */
  private buildRerouteUpdates(
    reroutedEdges: ReroutedEdgeInfo[],
    childIdSet: Set<string>,
    groupId: string
  ): (Pick<Edge, 'id'> & Partial<Edge>)[] {
    return reroutedEdges.map(({ edgeId, originalProps }) => ({
      id: edgeId,
      source: childIdSet.has(originalProps.source)
        ? groupId
        : originalProps.source,
      target: childIdSet.has(originalProps.target)
        ? groupId
        : originalProps.target,
      sourcePort: childIdSet.has(originalProps.source)
        ? undefined
        : originalProps.sourcePort,
      targetPort: childIdSet.has(originalProps.target)
        ? undefined
        : originalProps.targetPort,
    }));
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
