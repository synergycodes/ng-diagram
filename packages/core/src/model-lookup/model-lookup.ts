import { FlowCore } from '../flow-core';
import type { Edge, Node } from '../types';

export class ModelLookup {
  private _nodesMap = { map: new Map<string, Node>(), synchronized: false };
  private _edgesMap = { map: new Map<string, Edge>(), synchronized: false };
  private _directChildrenMap = { map: new Map<Node['id'], Node['id'][]>(), synchronized: false };
  private _descendantsCache = { map: new Map<Node['id'], Node['id'][]>(), synchronized: false }; // Cache for all descendants

  constructor(private readonly flowCore: FlowCore) {}

  /**
   * Desynchronizes the model lookup
   */
  public desynchronize() {
    this._nodesMap.synchronized = false;
    this._edgesMap.synchronized = false;
    this._directChildrenMap.synchronized = false;
    this._descendantsCache.synchronized = false;
  }

  /**
   * Gets the nodes map if it is not synchronized synchronize it
   * @returns Nodes map
   */
  get nodesMap() {
    if (!this._nodesMap.synchronized) {
      this._nodesMap = {
        map: new Map(this.flowCore.getState().nodes.map((node) => [node.id, node])),
        synchronized: true,
      };
    }
    return this._nodesMap.map;
  }

  /**
   * Gets the edges map if it is not synchronized synchronize it
   * @returns Edges map
   */
  get edgesMap() {
    if (!this._edgesMap.synchronized) {
      this._edgesMap = {
        map: new Map(this.flowCore.getState().edges.map((edge) => [edge.id, edge])),
        synchronized: true,
      };
    }
    return this._edgesMap.map;
  }

  /**
   * Gets the direct children map if it is not synchronized synchronize it
   * @returns Direct children map
   */
  get directChildrenMap() {
    if (!this._directChildrenMap.synchronized) {
      this._directChildrenMap = {
        map: this.buildDirectChildrenMap(this.flowCore.getState().nodes),
        synchronized: true,
      };
    }
    return this._directChildrenMap.map;
  }

  /**
   * Gets the descendants cache if it is not synchronized synchronize it
   * @returns Descendants cache
   */
  private get descendantsCache() {
    if (!this._descendantsCache.synchronized) {
      this._descendantsCache = { map: new Map(), synchronized: true };
    }
    return this._descendantsCache.map;
  }

  /**
   * Builds a map of group nodes to their children
   * @param nodes Nodes array
   * @returns Map where key is group id and value is array of child ids
   */
  private buildDirectChildrenMap(nodes: Node[]): Map<Node['id'], Node['id'][]> {
    const childrenMap = new Map<Node['id'], Node['id'][]>();

    for (const node of nodes) {
      if (node.groupId) {
        // Get existing children array or create new one
        const children = childrenMap.get(node.groupId) || [];

        children.push(node.id);
        childrenMap.set(node.groupId, children);
      }
    }

    return childrenMap;
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
   * Gets all children ids for a given group node id
   * @param groupId group node id
   * @returns Array of child node ids
   */
  private getChildrenIds(groupId: string): Node['id'][] {
    return this.directChildrenMap.get(groupId) ?? [];
  }

  /**
   * Gets all children nodes for a given group node id
   * @param groupId group node id
   * @returns Array of child nodes
   */
  private getChildren(groupId: string): Node[] {
    const childrenIds = this.getChildrenIds(groupId);

    if (!childrenIds) return [];

    return childrenIds.map((id) => this.getNodeById(id)).filter((node): node is Node => node !== null);
  }

  /**
   * Gets all descendant IDs for a given group node id (with caching)
   * @param groupId group node id
   * @returns Array of all descendant node ids (children, grandchildren, etc.)
   */
  private getAllDescendantIds(groupId: string): Node['id'][] {
    // Check cache first
    if (this.descendantsCache.has(groupId)) {
      return this.descendantsCache.get(groupId)!;
    }

    // Compute descendants if not cached
    const descendants = this.computeAllDescendants(groupId);

    // Cache the result
    this.descendantsCache.set(groupId, descendants);

    return descendants;
  }

  /**
   * Recursively computes all descendants for a given group node id
   * @param groupId group node id
   * @returns Array of all descendant node ids
   */
  private computeAllDescendants(groupId: string): Node['id'][] {
    const directChildren = this.getChildrenIds(groupId);

    if (!directChildren || directChildren.length === 0) {
      return [];
    }

    const allDescendants: Node['id'][] = [...directChildren];

    // Recursively get descendants of each child
    for (const childId of directChildren) {
      const childDescendants = this.computeAllDescendants(childId);
      allDescendants.push(...childDescendants);
    }

    return allDescendants;
  }

  /**
   * Gets all descendant nodes for a given group node id
   * @param groupId group node id
   * @returns Array of all descendant nodes (children, grandchildren, etc.)
   */
  private getAllDescendants(groupId: string): Node[] {
    const descendantIds = this.getAllDescendantIds(groupId);

    return descendantIds.map((id) => this.getNodeById(id)).filter((node): node is Node => node !== null);
  }

  /**
   * Checks if a node has children
   * @param nodeId Node id
   * @returns True if the node has children
   */
  public hasChildren(nodeId: string): boolean {
    return this.directChildrenMap.has(nodeId) && this.directChildrenMap.get(nodeId)!.length > 0;
  }

  /**
   * Checks if a node has any descendants (children, grandchildren, etc.)
   * @param nodeId Node id
   * @returns True if the node has any descendants
   */
  public hasDescendants(nodeId: string): boolean {
    return this.getAllDescendantIds(nodeId).length > 0;
  }

  /**
   * Gets the children map (read-only access)
   * @returns Children map
   */
  public getChildrenMap(): ReadonlyMap<Node['id'], readonly Node['id'][]> {
    return this.directChildrenMap;
  }

  /**
   * Gets all selected nodes
   * @returns Array of directly selected nodes
   */
  public getSelectedNodes(): Node[] {
    return this.flowCore.getState().nodes.filter((node) => node.selected);
  }

  /**
   * Gets the children of a node
   * @param nodeId Node id
   * @param directOnly Whether to get only direct children
   * @returns Array of children nodes
   */
  public getNodeChildren(nodeId: string, { directOnly = true }: { directOnly?: boolean } = {}): Node[] {
    return directOnly ? this.getChildren(nodeId) : this.getAllDescendants(nodeId);
  }

  /**
   * Gets the children ids of a node
   * @param nodeId Node id
   * @param directOnly Whether to get only direct children
   * @returns Array of children node ids
   */
  public getNodeChildrenIds(nodeId: string, { directOnly = true }: { directOnly?: boolean } = {}): Node['id'][] {
    return directOnly ? this.getChildrenIds(nodeId) : this.getAllDescendantIds(nodeId);
  }

  /**
   * Gets all selected nodes with their children
   * @returns Array of selected nodes with their children
   */
  public getSelectedNodesWithChildren({ directOnly = true }: { directOnly?: boolean } = {}): Node[] {
    const selectedNodes = this.getSelectedNodes();
    const allSelectedNodesIds = new Set<string>();
    const allSelectedNodes = [];

    for (const node of selectedNodes) {
      if (allSelectedNodesIds.has(node.id)) continue;
      allSelectedNodesIds.add(node.id);
      allSelectedNodes.push(node);
      const children = this.getNodeChildren(node.id, { directOnly });
      for (const child of children) {
        if (allSelectedNodesIds.has(child.id)) continue;
        allSelectedNodesIds.add(child.id);
        allSelectedNodes.push(child);
      }
    }

    return allSelectedNodes;
  }

  /**
   * Gets all selected edges
   * @returns Array of selected edges
   */
  public getSelectedEdges(): Edge[] {
    return this.flowCore.getState().edges.filter((edge) => edge.selected);
  }

  /**
   * Checks if a node is descendant of a group node
   * @param nodeId Node id
   * @param groupId Group node id
   * @returns True if the node is descendant of the group node
   */
  public isNodeDescendantOfGroup(nodeId: string, groupId: string): boolean {
    return this.getAllDescendantIds(groupId).includes(nodeId);
  }

  /**
   * Check for potential circular dependency between a node and a group
   * @param nodeId Node id
   * @param groupId Group node id
   * @returns True if the group is a descendant of the node or the node is the group
   */
  public wouldCreateCircularDependency(nodeId: string, groupId: string): boolean {
    // If trying to make a node its own parent
    if (nodeId === groupId) {
      return true;
    }

    // Check if groupId is already a descendant of nodeId
    return this.isNodeDescendantOfGroup(groupId, nodeId);
  }

  /**
   * Gets the full chain of parent group Nodes for a given nodeId.
   * @param nodeId Node id
   * @returns Array of parent group Node objects, from closest parent to farthest ancestor
   */
  public getParentChain(nodeId: string): Node[] {
    const chain: Node[] = [];
    let current = this.getNodeById(nodeId);

    while (current && current.groupId) {
      const parent = this.getNodeById(current.groupId);

      if (parent) {
        chain.push(parent);
        current = parent;
      }
    }
    return chain;
  }
}
