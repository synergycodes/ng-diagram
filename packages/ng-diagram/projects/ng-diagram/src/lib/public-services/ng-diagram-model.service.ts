import { effect, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Edge, GroupNode, Metadata, Node, Point, Port } from '../../core/src';
import { NgDiagramBaseService } from './ng-diagram-base.service';
import { NgDiagramService } from './ng-diagram.service';

/**
 * The `NgDiagramModelService` provides methods for accessing and manipulating the diagram's model,
 *
 * ## Example usage
 * ```typescript
 * private modelService = inject(NgDiagramModelService);
 *
 * // Add nodes
 * this.modelService.addNodes([node1, node2]);
 * ```
 *
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
      }
    });
  }

  /** @internal */
  ngOnDestroy(): void {
    try {
      this.flowCore.model.unregisterOnChange(this.modelListener);
    } catch (error) {
      console.error('Error unregistering model listener:', error);
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
   * @param edgeId Edge id.
   * @returns Edge or null if not found.
   */
  getEdgeById(edgeId: string): Edge | null {
    return this.flowCore.getEdgeById(edgeId) || null;
  }

  /**
   * Gets the nearest node in a range from a point.
   * @param point Point to check from.
   * @param range Range to check in.
   * @returns Nearest node in range or null.
   */
  getNearestNodeInRange(point: Point, range: number): Node | null {
    return this.flowCore.getNearestNodeInRange(point, range) || null;
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
   * @param nodeId Node id.
   * @returns Node or null if not found.
   */
  getNodeById(nodeId: string): Node | null {
    return this.flowCore.getNodeById(nodeId);
  }

  /**
   * Gets all nodes in a range from a point.
   * @param point Point to check from.
   * @param range Range to check in.
   * @returns Array of nodes in range.
   */
  getNodesInRange(point: Point, range: number): Node[] {
    return this.flowCore.getNodesInRange(point, range);
  }

  /**
   * Gets all edges connected to a node
   * @param nodeId Node id
   * @returns Array of edges where the node is either source or target
   */
  getConnectedEdges(nodeId: string): Edge[] {
    return this.flowCore.getConnectedEdges(nodeId);
  }

  /**
   * Gets all nodes connected to a node via edges
   * @param nodeId Node id
   * @returns Array of nodes connected to the given node
   */
  getConnectedNodes(nodeId: string): Node[] {
    return this.flowCore.getConnectedNodes(nodeId);
  }

  /**
   * Gets the source and target nodes of an edge
   * @param edgeId Edge id
   * @returns Object containing source and target nodes, or null if edge doesn't exist
   */
  getNodeEnds(edgeId: string): { source: Node; target: Node } | null {
    return this.flowCore.getNodeEnds(edgeId);
  }

  /**
   * Gets all children nodes for a given group node id
   * @param groupId group node id
   * @returns Array of child nodes
   */
  getChildren(groupId: string): Node[] {
    return this.flowCore.getChildren(groupId);
  }

  /**
   * Gets all nested children (descendants) of a group node
   * @param groupId Group node id
   * @returns Array of all descendant nodes (children, grandchildren, etc.)
   */
  getChildrenNested(groupId: string): Node[] {
    return this.flowCore.getChildrenNested(groupId);
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
   * @param nodeId Node id
   * @returns Array of parent group Node objects, from closest parent to farthest ancestor
   */
  getParentHierarchy(nodeId: string): GroupNode[] {
    return this.flowCore.getParentHierarchy(nodeId);
  }

  /**
   * Detects collision with other nodes by finding all nodes whose rectangles intersect
   * with the specified node's bounding rectangle.
   *
   * @param nodeId - The ID of the node to check for collisions
   * @returns An array of node IDs that overlap with the specified node
   */
  getOverlappingNodes(nodeId: string): string[] {
    return this.flowCore.getOverlappingNodes(nodeId);
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
   * @param edgeId Edge id.
   * @param data New data to set for the edge (can be strongly typed).
   */
  updateEdgeData<T extends Record<string, unknown> | undefined>(edgeId: string, data: T) {
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
   * @param nodeId Node id.
   * @param data New data to set for the node (can be strongly typed).
   */
  updateNodeData<T extends Record<string, unknown> | undefined>(nodeId: string, data: T) {
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
