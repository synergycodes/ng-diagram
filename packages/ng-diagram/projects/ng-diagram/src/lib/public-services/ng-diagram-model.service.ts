import { effect, inject, Injectable, OnDestroy, signal, untracked } from '@angular/core';
import {
  alignManualPointsPatch,
  computeDetachAnchor,
  DanglingEndpoint,
  DataObject,
  Edge,
  EdgeEnd,
  getDanglingEndpoints,
  getNearestDanglingEndpointInRange,
  getPortFlowPosition,
  GroupNode,
  Metadata,
  Node,
  Point,
  Port,
  Rect,
} from '../../core/src';
import { isValidEndpointTarget, validateConnection } from '../../core/src/command-handler/commands/linking/utils';
import { calculatePartsBounds } from '../../core/src/utils/dimensions';
import { emitWithMeasurementOption } from './emit-with-measurement-option';
import { NgDiagramBaseService } from './ng-diagram-base.service';
import { NgDiagramService } from './ng-diagram.service';

/**
 * The `NgDiagramModelService` provides methods for accessing and manipulating the diagram's model.
 *
 * ## Example usage
 * ```typescript
 * private modelService = inject(NgDiagramModelService);
 *
 * // Add nodes
 * this.modelService.addNodes([node1, node2]);
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Services
 */
@Injectable()
export class NgDiagramModelService extends NgDiagramBaseService implements OnDestroy {
  private readonly diagramService = inject(NgDiagramService);

  private _nodes = signal<Node[]>([]);
  private _edges = signal<Edge[]>([]);
  private _metadata = signal<Metadata>({ viewport: { x: 0, y: 0, scale: 1 } });

  /**
   * Readonly signal of current nodes in the diagram.
   */
  readonly nodes = this._nodes.asReadonly();

  /**
   * Readonly signal of current edges in the diagram.
   */
  readonly edges = this._edges.asReadonly();

  /**
   * Readonly signal of current diagram metadata.
   */
  readonly metadata = this._metadata.asReadonly();

  constructor() {
    super();
    effect(() => {
      if (this.diagramService.isInitialized()) {
        this.flowCore.model.onChange(this.modelListener);
        untracked(() =>
          this.modelListener({
            nodes: this.flowCore.model.getNodes(),
            edges: this.flowCore.model.getEdges(),
            metadata: this.flowCore.model.getMetadata(),
          })
        );
      }
    });
  }

  /**
   * Unregisters the model listener to support custom model adapters
   * that may outlive this service (e.g., singleton or shared adapters).
   * @internal
   */
  ngOnDestroy(): void {
    if (this.flowCoreProvider.isInitialized()) {
      this.flowCore.model.unregisterOnChange(this.modelListener);
    }
  }

  // ===================
  // GENERAL MODEL METHODS
  // ===================

  /**
   * Returns the current model that NgDiagram instance is using.
   * Returns null if flowCore is not initialized.
   */
  getModel() {
    return this.flowCore.model;
  }

  /**
   * Serializes the current model to a JSON string.
   * @returns The model as a JSON string.
   */
  toJSON(): string {
    return this.flowCore.model.toJSON();
  }

  // ===================
  // ADD METHODS
  // ===================

  /**
   * Adds new edges to the diagram.
   * @param edges Array of edges to add.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after the
   * added elements (e.g. edge labels) have been measured. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  addEdges(edges: Edge[], options?: { waitForMeasurements?: boolean }): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'addEdges', { edges }, options);
  }

  /**
   * Adds new nodes to the diagram.
   * @param nodes Array of nodes to add.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after the
   * added nodes have been measured — useful before calling `zoomToFit()` or `centerOnNode()`.
   * Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  addNodes(nodes: Node[], options?: { waitForMeasurements?: boolean }): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'addNodes', { nodes }, options);
  }

  // ===================
  // GET METHODS
  // ===================

  /**
   * Gets an edge by id.
   * @typeParam T - The type of the edge's `data` property. Defaults to `DataObject`.
   * @param edgeId Edge id.
   * @returns Edge or null if not found.
   */
  getEdgeById<T extends DataObject = DataObject>(edgeId: string): Edge<T> | null {
    return (this.flowCore.getEdgeById(edgeId) as Edge<T> | null) || null;
  }

  /**
   * Gets the nearest node in a range from a point.
   * @typeParam T - The type of the node's `data` property. Defaults to `DataObject`.
   * @param point Point to check from.
   * @param range Range to check in.
   * @returns Nearest node in range or null.
   */
  getNearestNodeInRange<T extends DataObject = DataObject>(point: Point, range: number): Node<T> | null {
    return (this.flowCore.getNearestNodeInRange(point, range) as Node<T> | null) || null;
  }

  /**
   * Gets the nearest port in a range from a point.
   * @param point Point to check from.
   * @param range Range to check in.
   * @returns Nearest port in range or null.
   */
  getNearestPortInRange(point: Point, range: number): Port | null {
    return this.flowCore.getNearestPortInRange(point, range) || null;
  }

  /**
   * Returns the free (unconnected) endpoints of all edges in the model. A dual
   * dangling edge gives two entries. Temporary and effectively hidden edges
   * are skipped.
   * @returns The free endpoints with their edge, end and anchor position.
   * @since 1.4.0
   */
  getDanglingEndpoints(): DanglingEndpoint[] {
    // The model lookup rebuilds its dangling-edge list lazily after a state
    // change with one pass over all edges, then serves it from cache until the
    // next change; this walks only the dangling subset.
    return getDanglingEndpoints(this.flowCore.modelLookup.danglingEdges);
  }

  /**
   * Finds the free edge endpoint nearest to a point within a range. It works
   * like {@link getNearestPortInRange}, but for the free endpoints of dangling
   * edges. Temporary and effectively hidden edges are skipped.
   * @param point Point to check from.
   * @param range Range to check in.
   * @returns Nearest free endpoint in range, or null.
   * @since 1.4.0
   */
  getNearestDanglingEndpointInRange(point: Point, range: number): DanglingEndpoint | null {
    // The model lookup rebuilds its dangling-edge list lazily after a state
    // change with one pass over all edges, then serves it from cache until the
    // next change; each call walks only the dangling subset.
    return getNearestDanglingEndpointInRange(this.flowCore.modelLookup.danglingEdges, point, range);
  }

  /**
   * Detaches one endpoint of an edge, so that it becomes a free (dangling)
   * endpoint.
   *
   * When `position` is omitted, the endpoint stays anchored where it is now:
   * at the current position of the port when the edge was connected to a
   * port, otherwise at the routed endpoint of the edge.
   *
   * Requires `danglingEdges.enabled`. With the feature off, this method does
   * nothing and logs a console warning.
   *
   * @param edgeId ID of the edge to detach.
   * @param end Which endpoint to detach.
   * @param position Optional anchor position for the freed endpoint, in flow coordinates.
   * @since 1.4.0
   */
  detachEdge(edgeId: string, end: EdgeEnd, position?: Point): Promise<void> {
    if (!this.flowCore.config.danglingEdges.enabled) {
      console.warn(
        '[ngDiagram] detachEdge ignored: dangling edges are disabled. ' +
          'Set config.danglingEdges.enabled = true to detach edge endpoints.'
      );
      return Promise.resolve();
    }

    const edge = this.getEdgeById(edgeId);
    if (!edge) {
      return Promise.resolve();
    }

    const nodeId = end === 'source' ? edge.source : edge.target;
    if (!nodeId) {
      // Already dangling on this end — only move the anchor if asked to.
      if (!position) {
        return Promise.resolve();
      }
      return this.updateEdge(edgeId, {
        ...(end === 'source' ? { sourcePosition: position } : { targetPosition: position }),
        ...alignManualPointsPatch(edge, end, position),
      });
    }

    const anchor = position ?? computeDetachAnchor(edge, end, this.getNodeById(nodeId));
    if (!anchor) {
      return Promise.resolve();
    }

    return this.updateEdge(edgeId, {
      ...(end === 'source'
        ? { source: '', sourcePort: undefined, sourcePosition: anchor }
        : { target: '', targetPort: undefined, targetPosition: anchor }),
      ...alignManualPointsPatch(edge, end, anchor),
    });
  }

  /**
   * Attaches one endpoint of an edge to a node and, optionally, to a port.
   * This is the opposite of {@link detachEdge}.
   *
   * The same checks as for a relink drop apply: the node must exist and be
   * visible, and the port must exist, be visible and have the right direction.
   * The connection is then validated with `linking.validateConnection`, which
   * receives the attached node as `source` or `target` according to `end`,
   * and a context with `reason: 'attach'`.
   *
   * @param edgeId ID of the edge to attach.
   * @param end Which endpoint to attach.
   * @param nodeId ID of the node to attach to.
   * @param portId ID of the port to attach to. When omitted, the endpoint is attached to the node without a port.
   * @returns Whether the connection was valid and applied.
   * @since 1.4.0
   */
  async attachEdge(edgeId: string, end: EdgeEnd, nodeId: string, portId?: string): Promise<boolean> {
    const edge = this.getEdgeById(edgeId);
    if (!edge) {
      return false;
    }

    // Same structural rules as a relink drop: the node must exist and be
    // visible, the port must exist, point the right direction and not be
    // template-hidden — otherwise the edge would reference a port that
    // routing cannot resolve.
    if (!isValidEndpointTarget(this.flowCore, end, nodeId, portId)) {
      return false;
    }

    const sourceNodeId = end === 'source' ? nodeId : edge.source || undefined;
    const sourcePortId = end === 'source' ? portId : edge.sourcePort;
    const targetNodeId = end === 'target' ? nodeId : edge.target || undefined;
    const targetPortId = end === 'target' ? portId : edge.targetPort;

    if (
      !validateConnection(this.flowCore, sourceNodeId, sourcePortId, targetNodeId, targetPortId, true, {
        reason: 'attach',
        edge,
        end,
      })
    ) {
      return false;
    }

    const node = this.getNodeById(nodeId);
    const newAnchor = node && portId ? getPortFlowPosition(node, portId) : null;

    await this.updateEdge(edgeId, {
      ...(end === 'source'
        ? { source: nodeId, sourcePort: portId, sourcePosition: undefined }
        : { target: nodeId, targetPort: portId, targetPosition: undefined }),
      ...(newAnchor ? alignManualPointsPatch(edge, end, newAnchor) : {}),
    });
    return true;
  }

  /**
   * Gets a node by id.
   * @typeParam T - The type of the node's `data` property. Defaults to `DataObject`.
   * @param nodeId Node id.
   * @returns Node or null if not found.
   */
  getNodeById<T extends DataObject = DataObject>(nodeId: string): Node<T> | null {
    return this.flowCore.getNodeById(nodeId) as Node<T> | null;
  }

  /**
   * Gets all nodes in a range from a point.
   * @typeParam T - The type of the nodes' `data` property. Defaults to `DataObject`.
   * @param point Point to check from.
   * @param range Range to check in.
   * @returns Array of nodes in range.
   */
  getNodesInRange<T extends DataObject = DataObject>(point: Point, range: number): Node<T>[] {
    return this.flowCore.getNodesInRange(point, range) as Node<T>[];
  }

  /**
   * Gets all edges connected to a node
   * @typeParam T - The type of the edges' `data` property. Defaults to `DataObject`.
   * @param nodeId Node id
   * @returns Array of edges where the node is either source or target
   */
  getConnectedEdges<T extends DataObject = DataObject>(nodeId: string): Edge<T>[] {
    return this.flowCore.getConnectedEdges(nodeId) as Edge<T>[];
  }

  /**
   * Gets all nodes connected to a node via edges
   * @typeParam T - The type of the nodes' `data` property. Defaults to `DataObject`.
   * @param nodeId Node id
   * @returns Array of nodes connected to the given node
   */
  getConnectedNodes<T extends DataObject = DataObject>(nodeId: string): Node<T>[] {
    return this.flowCore.getConnectedNodes(nodeId) as Node<T>[];
  }

  /**
   * Gets the source and target nodes of an edge
   * @typeParam S - The type of the source node's `data` property. Defaults to `DataObject`.
   * @typeParam T - The type of the target node's `data` property. Defaults to `DataObject`.
   * @param edgeId Edge id
   * @returns Object containing source and target nodes, or null if edge doesn't exist
   */
  getNodeEnds<S extends DataObject = DataObject, T extends DataObject = DataObject>(
    edgeId: string
  ): { source: Node<S>; target: Node<T> } | null {
    return this.flowCore.getNodeEnds(edgeId) as { source: Node<S>; target: Node<T> } | null;
  }

  /**
   * Gets all children nodes for a given group node id
   * @typeParam T - The type of the nodes' `data` property. Defaults to `DataObject`.
   * @param groupId group node id
   * @returns Array of child nodes
   */
  getChildren<T extends DataObject = DataObject>(groupId: string): Node<T>[] {
    return this.flowCore.getChildren(groupId) as Node<T>[];
  }

  /**
   * Gets all nested children (descendants) of a group node
   * @typeParam T - The type of the nodes' `data` property. Defaults to `DataObject`.
   * @param groupId Group node id
   * @returns Array of all descendant nodes (children, grandchildren, etc.)
   */
  getChildrenNested<T extends DataObject = DataObject>(groupId: string): Node<T>[] {
    return this.flowCore.getChildrenNested(groupId) as Node<T>[];
  }

  /**
   * Checks if a node is a nested child (descendant) of a group node
   * @param nodeId Node id
   * @param groupId Group node id
   * @returns True if the node is part of the group's nested subgraph
   */
  isNestedChild(nodeId: string, groupId: string): boolean {
    return this.flowCore.isNestedChild(nodeId, groupId);
  }

  /**
   * Gets the full chain of parent group Nodes for a given nodeId.
   * @typeParam T - The type of the group nodes' `data` property. Defaults to `DataObject`.
   * @param nodeId Node id
   * @returns Array of parent group Node objects, from closest parent to farthest ancestor
   */
  getParentHierarchy<T extends DataObject = DataObject>(nodeId: string): GroupNode<T>[] {
    return this.flowCore.getParentHierarchy(nodeId) as GroupNode<T>[];
  }

  /**
   * Detects collision with other nodes by finding all nodes whose rectangles intersect
   * with the specified node's bounding rectangle.
   *
   * @typeParam T - The type of the nodes' `data` property. Defaults to `DataObject`.
   * @param nodeId - The ID of the node to check for collisions
   * @returns An array of Nodes that overlap with the specified node
   */
  getOverlappingNodes<T extends DataObject = DataObject>(nodeId: string): Node<T>[];
  /**
   * @since 0.9.0
   *
   * Detects collision with other nodes by finding all nodes whose rectangles intersect
   * with the specified node's bounding rectangle.
   *
   * @typeParam T - The type of the nodes' `data` property. Defaults to `DataObject`.
   * @param node - The node to check for collisions
   * @returns An array of Nodes that overlap with the specified node
   */
  getOverlappingNodes<T extends DataObject = DataObject>(node: Node<T>): Node<T>[];
  getOverlappingNodes<T extends DataObject = DataObject>(nodeOrId: Node<T> | string): Node<T>[] {
    return this.flowCore.getOverlappingNodes(nodeOrId as Node & string) as Node<T>[];
  }

  /**
   * @since 0.9.0
   *
   * Computes the axis-aligned bounding rectangle that contains all specified nodes and edges.
   *
   * Node bounds come from `measuredBounds`, which includes the measured ports and the rotation,
   * not from the raw `position` and `size` in the model. Nodes must therefore already be measured
   * (rendered), and the result can be larger than the node rectangles because of the ports.
   * Edges contribute their routed `points` and their measured labels.
   *
   * @remarks Since 1.4.0, effectively hidden elements (`computedHidden`) are left out, so their
   * old geometry does not enlarge the result. If all given elements are hidden, the result is
   * the same zero-size rectangle at the origin as for unmeasured elements.
   *
   * @param nodes Array of nodes
   * @param edges Array of edges
   * @returns Bounding rectangle containing all visible nodes and edges. When there is nothing to
   * measure (both arrays are empty, no visible node has `measuredBounds`, and no visible edge
   * has `points`), returns a zero-size rectangle at the origin (`{ x: 0, y: 0, width: 0, height: 0 }`).
   */
  computePartsBounds(nodes: Node[], edges: Edge[]): Rect {
    return calculatePartsBounds(nodes, edges) ?? { x: 0, y: 0, width: 0, height: 0 };
  }

  // ===================
  // UPDATE METHODS
  // ===================

  /**
   * Updates the properties of an edge.
   * @param edgeId Edge id.
   * @param edge New edge properties.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after
   * measurements triggered by the update have completed. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  updateEdge(edgeId: string, edge: Partial<Edge>, options?: { waitForMeasurements?: boolean }): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'updateEdge', { id: edgeId, edgeChanges: { ...edge } }, options);
  }

  /**
   * Updates the data of an edge.
   * @typeParam T - The type of the edge's `data` property. Defaults to `DataObject`.
   * @param edgeId Edge id.
   * @param data New data to set for the edge.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after
   * measurements triggered by the update (e.g. re-rendered edge labels) have completed.
   * Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  updateEdgeData<T extends DataObject = DataObject>(
    edgeId: string,
    data: T,
    options?: { waitForMeasurements?: boolean }
  ): Promise<void> {
    return this.updateEdge(edgeId, { data }, options);
  }

  /**
   * Updates the properties of a node.
   * @param nodeId Node id.
   * @param node New node properties.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after
   * measurements triggered by the update have completed. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  updateNode(nodeId: string, node: Partial<Node>, options?: { waitForMeasurements?: boolean }): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'updateNode', { id: nodeId, nodeChanges: { ...node } }, options);
  }

  /**
   * Updates the data of a node.
   * @typeParam T - The type of the node's `data` property. Defaults to `DataObject`.
   * @param nodeId Node id.
   * @param data New data to set for the node.
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after
   * measurements triggered by the update (e.g. a template resized by the new data) have
   * completed. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  updateNodeData<T extends DataObject = DataObject>(
    nodeId: string,
    data: T,
    options?: { waitForMeasurements?: boolean }
  ): Promise<void> {
    return this.updateNode(nodeId, { data }, options);
  }

  /**
   * Updates multiple nodes at once.
   * @param nodes Array of node updates (must include id and any properties to update).
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after
   * measurements triggered by the update have completed. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  updateNodes(nodes: (Pick<Node, 'id'> & Partial<Node>)[], options?: { waitForMeasurements?: boolean }): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'updateNodes', { nodes }, options);
  }

  /**
   * Updates multiple edges at once.
   * @param edges Array of edge updates (must include id and any properties to update).
   * @param options Optional settings. Set `waitForMeasurements: true` to resolve only after
   * measurements triggered by the update have completed. Available since 1.3.0.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  updateEdges(edges: (Pick<Edge, 'id'> & Partial<Edge>)[], options?: { waitForMeasurements?: boolean }): Promise<void> {
    return emitWithMeasurementOption(this.flowCore, 'updateEdges', { edges }, options);
  }

  // ===================
  // DELETE METHODS
  // ===================

  /**
   * Deletes edges by their IDs.
   * @param ids Array of edge IDs to delete.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  deleteEdges(ids: string[]): Promise<void> {
    return this.flowCore.commandHandler.emit('deleteEdges', { ids });
  }

  /**
   * Deletes nodes by their IDs.
   *
   * Deleting a group also deletes all of its descendants (children, grandchildren, and so on).
   * Edges connected to any deleted node are removed as well. This is the same behavior as
   * deleting the selection.
   * @param ids Array of node IDs to delete.
   * @returns A promise that resolves once the change has been applied to the model. Inside a transaction, the promise resolves right away and the change is applied when the transaction commits.
   */
  deleteNodes(ids: string[]): Promise<void> {
    return this.flowCore.commandHandler.emit('deleteNodes', { ids });
  }

  private modelListener = (data: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => {
    this._nodes.set(data.nodes);
    this._edges.set(data.edges);
    this._metadata.set(data.metadata);
  };
}
