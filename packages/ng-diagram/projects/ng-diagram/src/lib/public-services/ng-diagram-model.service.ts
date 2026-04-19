import { effect, inject, Injectable, OnDestroy, signal, untracked } from '@angular/core';
import { DataObject, Edge, GroupNode, Metadata, Node, Point, Port, Rect } from '../../core/src';
import { calculatePartsBounds } from '../../core/src/utils/dimensions';
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
   */
  addEdges(edges: Edge[]) {
    this.flowCore.commandHandler.emit('addEdges', { edges });
  }

  /**
   * Adds new nodes to the diagram.
   * @param nodes Array of nodes to add.
   */
  addNodes(nodes: Node[]) {
    this.flowCore.commandHandler.emit('addNodes', { nodes });
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
   * @param nodes Array of nodes
   * @param edges Array of edges
   * @returns Bounding rectangle containing all nodes and edges
   */
  computePartsBounds(nodes: Node[], edges: Edge[]): Rect {
    return calculatePartsBounds(nodes, edges);
  }

  // ===================
  // UPDATE METHODS
  // ===================

  /**
   * Updates the properties of an edge.
   * @param edgeId Edge id.
   * @param edge New edge properties.
   */
  updateEdge(edgeId: string, edge: Partial<Edge>) {
    this.flowCore.commandHandler.emit('updateEdge', {
      id: edgeId,
      edgeChanges: { ...edge },
    });
  }

  /**
   * Updates the data of an edge.
   * @typeParam T - The type of the edge's `data` property. Defaults to `DataObject`.
   * @param edgeId Edge id.
   * @param data New data to set for the edge.
   */
  updateEdgeData<T extends DataObject = DataObject>(edgeId: string, data: T) {
    this.flowCore.commandHandler.emit('updateEdge', {
      id: edgeId,
      edgeChanges: {
        data: data,
      },
    });
  }

  /**
   * Updates the properties of a node.
   * @param nodeId Node id.
   * @param node New node properties.
   */
  updateNode(nodeId: string, node: Partial<Node>) {
    this.flowCore.commandHandler.emit('updateNode', {
      id: nodeId,
      nodeChanges: { ...node },
    });
  }

  /**
   * Updates the data of a node.
   * @typeParam T - The type of the node's `data` property. Defaults to `DataObject`.
   * @param nodeId Node id.
   * @param data New data to set for the node.
   */
  updateNodeData<T extends DataObject = DataObject>(nodeId: string, data: T) {
    this.flowCore.commandHandler.emit('updateNode', {
      id: nodeId,
      nodeChanges: {
        data: data,
      },
    });
  }

  /**
   * Updates multiple nodes at once.
   * @param nodes Array of node updates (must include id and any properties to update).
   */
  updateNodes(nodes: (Pick<Node, 'id'> & Partial<Node>)[]) {
    this.flowCore.commandHandler.emit('updateNodes', { nodes });
  }

  /**
   * Updates multiple edges at once.
   * @param edges Array of edge updates (must include id and any properties to update).
   */
  updateEdges(edges: (Pick<Edge, 'id'> & Partial<Edge>)[]) {
    this.flowCore.commandHandler.emit('updateEdges', { edges });
  }

  // ===================
  // DELETE METHODS
  // ===================

  /**
   * Deletes edges by their IDs.
   * @param ids Array of edge IDs to delete.
   */
  deleteEdges(ids: string[]) {
    this.flowCore.commandHandler.emit('deleteEdges', { ids });
  }

  /**
   * Deletes nodes by their IDs.
   * @param ids Array of node IDs to delete.
   */
  deleteNodes(ids: string[]) {
    this.flowCore.commandHandler.emit('deleteNodes', { ids });
  }

  private modelListener = (data: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => {
    this._nodes.set(data.nodes);
    this._edges.set(data.edges);
    this._metadata.set(data.metadata);
  };
}
