import { computed, inject, Injectable } from '@angular/core';
import { Edge, FlowCore, MiddlewareChain, Node, Port } from '@angularflow/core';
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
}
