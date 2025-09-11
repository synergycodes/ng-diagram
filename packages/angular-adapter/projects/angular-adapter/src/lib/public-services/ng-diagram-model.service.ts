import { effect, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { Edge, FlowCore, Metadata, MiddlewareChain, Node, Port } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';
import { NgDiagramService } from './ng-diagram.service';

@Injectable()
export class NgDiagramModelService<TMiddlewares extends MiddlewareChain = []> implements OnDestroy {
  private readonly diagramService = inject(NgDiagramService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  private _nodes = signal<Node[]>([]);
  private _edges = signal<Edge[]>([]);
  private _metadata = signal<Metadata>({ viewport: { x: 0, y: 0, scale: 1 }, middlewaresConfig: {} });

  nodes = this._nodes.asReadonly();
  edges = this._edges.asReadonly();
  metadata = this._metadata.asReadonly();

  private get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
  }

  constructor() {
    effect(() => {
      if (this.diagramService.isInitialized()) {
        this.flowCore.model.onChange(this.modelListener);
      }
    });
  }

  ngOnDestroy(): void {
    try {
      this.flowCore.model.unregisterOnChange(this.modelListener);
    } catch (error) {
      console.error('Error unregistering model listener:', error);
    }
  }

  /**
   * Returns the current model that NgDiagram instance is using
   * Returns null if flowCore is not initialized
   */
  getModel() {
    return this.flowCore.model;
  }

  /**
   * Gets a node by id
   * @param nodeId Node id
   * @returns Node
   */
  getNodeById(nodeId: string): Node | null {
    return this.flowCore.getNodeById(nodeId);
  }

  /**
   * Updates the data of a node
   * @param nodeId Node id
   * @param data New data to set for the node (can be strongly typed)
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
   * Updates the properties of a node
   * @param nodeId Node id
   * @param node New node properties
   */
  updateNode(nodeId: string, node: Partial<Node>) {
    this.flowCore.commandHandler.emit('updateNode', {
      id: nodeId,
      nodeChanges: { ...node },
    });
  }

  /**
   * Gets all nodes in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Array of nodes in range
   */
  getNodesInRange(point: { x: number; y: number }, range: number): Node[] {
    return this.flowCore.getNodesInRange(point, range);
  }

  /**
   * Gets the nearest node in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest node in range or null
   */
  getNearestNodeInRange(point: { x: number; y: number }, range: number): Node | null {
    return this.flowCore.getNearestNodeInRange(point, range) || null;
  }

  /**
   * Gets the nearest port in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest port in range or null
   */
  getNearestPortInRange(point: { x: number; y: number }, range: number): Port | null {
    return this.flowCore.getNearestPortInRange(point, range) || null;
  }

  /**
   * Gets an edge by id
   * @param edgeId Edge id
   * @returns Edge
   */
  getEdgeById(edgeId: string): Edge | null {
    return this.flowCore.getEdgeById(edgeId) || null;
  }

  /**
   * Updates the data of an edge
   * @param edgeId Edge id
   * @param data New data to set for the edge (can be strongly typed)
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
   * Updates the properties of a node
   * @param edgeId Edge id
   * @param edge New edge properties
   */
  updateEdge(edgeId: string, edge: Partial<Edge>) {
    this.flowCore.commandHandler.emit('updateEdge', {
      id: edgeId,
      edgeChanges: { ...edge },
    });
  }

  toJSON(): string {
    return this.flowCore.model.toJSON();
  }

  /**
   * Adds new nodes to the diagram.
   * @param nodes Array of nodes to add.
   */
  addNodes(nodes: Node[]) {
    this.flowCore.commandHandler.emit('addNodes', { nodes });
  }

  /**
   * Adds new edges to the diagram.
   * @param edges Array of edges to add.
   */
  addEdges(edges: Edge[]) {
    this.flowCore.commandHandler.emit('addEdges', { edges });
  }

  /**
   * Updates multiple nodes at once.
   * @param nodes Array of node updates (must include id and any properties to update).
   */
  updateNodes(nodes: (Pick<Node, 'id'> & Partial<Node>)[]) {
    this.flowCore.commandHandler.emit('updateNodes', { nodes });
  }

  /**
   * Deletes nodes by their IDs.
   * @param ids Array of node IDs to delete.
   */
  deleteNodes(ids: string[]) {
    this.flowCore.commandHandler.emit('deleteNodes', { ids });
  }

  /**
   * Deletes edges by their IDs.
   * @param ids Array of edge IDs to delete.
   */
  deleteEdges(ids: string[]) {
    this.flowCore.commandHandler.emit('deleteEdges', { ids });
  }

  private modelListener = (data: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => {
    this._nodes.set(data.nodes);
    this._edges.set(data.edges);
    this._metadata.set(data.metadata);
  };
}
