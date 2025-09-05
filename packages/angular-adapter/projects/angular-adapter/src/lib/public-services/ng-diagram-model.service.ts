import { computed, inject, Injectable } from '@angular/core';
import { Edge, FlowCore, MiddlewareChain, Node, Point, Port } from '@angularflow/core';
import { FlowCoreProviderService } from '../services';

@Injectable()
export class NgDiagramModelService<TMiddlewares extends MiddlewareChain = []> {
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  private get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
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

  /**
   * Gets the current selection state as a reactive signal
   * This signal automatically updates when selection changes or when selected nodes/edges are modified
   * @returns Signal containing the current selection
   */
  getSelection() {
    return computed(() => {
      const { nodes, edges } = this.flowCore.getState();
      return {
        nodes: nodes.filter((node) => node.selected),
        edges: edges.filter((edge) => edge.selected),
      };
    });
  }

  toJSON(): string {
    return this.flowCore.model.toJSON();
  }

  /**
   * Sets the selection state
   * @param nodeIds Nodes to select
   * @param edgeIds Edges to select
   */
  setSelection(nodeIds: string[] = [], edgeIds: string[] = []) {
    this.flowCore.commandHandler.emit('select', {
      nodeIds,
      edgeIds,
    });
  }

  /**
   * Copies the current selection to the clipboard
   */
  copySelection() {
    this.flowCore.commandHandler.emit('copy');
  }

  /**
   * Pastes the copied selection at a specific position
   * @param position Position to paste the selection at
   */
  pasteSelection(position: Point) {
    this.flowCore.commandHandler.emit('paste', { position });
  }

  /**
   * Deletes the current selection
   */
  deleteSelection() {
    this.flowCore.commandHandler.emit('deleteSelection');
  }

  /**
   * Converts a client position to a flow position
   * @param clientPosition Client position to convert
   * @returns Flow position
   */
  clientToFlowPosition(clientPosition: Point): Point {
    return this.flowCore.clientToFlowPosition(clientPosition);
  }

  /**
   * Converts a flow position to a client position
   * @param flowPosition Flow position to convert
   * @returns Client position
   */
  flowToClientPosition(flowPosition: Point): Point {
    return this.flowCore.flowToClientPosition(flowPosition);
  }

  /**
   * Converts a client position to a position relative to the flow viewport
   * @param clientPosition Client position
   * @returns position on the flow viewport
   */
  clientToFlowViewportPosition(clientPosition: Point): Point {
    return this.flowCore.clientToFlowViewportPosition(clientPosition);
  }
}
