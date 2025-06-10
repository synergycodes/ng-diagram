import { FlowCore } from '../flow-core';
import type { Edge, FlowState, Node } from '../types';

export class ModelLookup {
  nodesMap: Map<string, Node>;
  edgesMap: Map<string, Edge>;
  childrenMap: Map<Node['id'], Node['id'][]>;

  constructor(private readonly flowCore: FlowCore) {
    const nodes = this.flowCore.model.getNodes();
    const edges = this.flowCore.model.getEdges();

    this.nodesMap = new Map(nodes.map((node) => [node.id, node]));
    this.edgesMap = new Map(edges.map((edge) => [edge.id, edge]));
    this.childrenMap = this.buildChildrenMap(nodes);
  }

  /**
   * Maps model nodes to a map
   * @param nodes Nodes
   * @returns Map of nodes
   */
  private mapModelNodesToMap(nodes: Node[]): Map<string, Node> {
    return new Map(nodes.map((node) => [node.id, node]));
  }

  /**
   * Maps model edges to a map
   * @param edges Edges
   * @returns Map of edges
   */
  private mapModelEdgesToMap(edges: Edge[]): Map<string, Edge> {
    return new Map(edges.map((edge) => [edge.id, edge]));
  }

  /**
   * Builds a map of parent nodes to their children
   * @param nodes Nodes array
   * @returns Map where key is parent id and value is array of child ids
   */
  private buildChildrenMap(nodes: Node[]): Map<Node['id'], Node['id'][]> {
    const childrenMap = new Map<Node['id'], Node['id'][]>();

    for (const node of nodes) {
      if (node.parentId) {
        // Get existing children array or create new one
        const children = childrenMap.get(node.parentId) || [];

        children.push(node.id);
        childrenMap.set(node.parentId, children);
      }
    }

    return childrenMap;
  }

  /**
   * Updates the model lookup
   */
  public update(state: Pick<FlowState, 'nodes' | 'edges'>) {
    this.nodesMap = this.mapModelNodesToMap(state.nodes);
    this.edgesMap = this.mapModelEdgesToMap(state.edges);
    this.childrenMap = this.buildChildrenMap(state.nodes);
  }

  /**
   * Gets a node by id
   * @param nodeId Node id
   * @returns Node
   */
  public getNodeById(nodeId: string): Node | null {
    return this.nodesMap.get(nodeId) ?? null;
  }

  /**
   * Gets an edge by id
   * @param edgeId Edge id
   * @returns Edge
   */
  public getEdgeById(edgeId: string): Edge | null {
    return this.edgesMap.get(edgeId) ?? null;
  }

  /**
   * Gets all children ids for a given parent node id
   * @param parentId Parent node id
   * @returns Array of child node ids
   */
  public getChildrenIds(parentId: string): Node['id'][] {
    return this.childrenMap.get(parentId) || [];
  }

  /**
   * Gets all children nodes for a given parent node id
   * @param parentId Parent node id
   * @returns Array of child nodes
   */
  public getChildren(parentId: string): Node[] {
    const childrenIds = this.getChildrenIds(parentId);
    return childrenIds.map((id) => this.getNodeById(id)).filter((node): node is Node => node !== null);
  }

  /**
   * Checks if a node has children
   * @param nodeId Node id
   * @returns True if the node has children
   */
  public hasChildren(nodeId: string): boolean {
    return this.childrenMap.has(nodeId) && this.childrenMap.get(nodeId)!.length > 0;
  }

  /**
   * Gets the children map (read-only access)
   * @returns Children map
   */
  public getChildrenMap(): ReadonlyMap<Node['id'], readonly Node['id'][]> {
    return this.childrenMap;
  }

  /**
   * Gets all selected nodes
   * @returns Array of directly selected nodes
   */
  public getSelectedNodes(): Node[] {
    return this.flowCore.getState().nodes.filter((node) => node.selected);
  }

  /**
   * Gets all selected nodes with their children
   * @returns Array of selected nodes with their children
   */
  public getSelectedNodesWithChildren(): Node[] {
    const selectedNodes = this.getSelectedNodes();

    return selectedNodes.flatMap((node) => [node, ...this.getChildren(node.id)]);
  }
}
