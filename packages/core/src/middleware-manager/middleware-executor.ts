import { FlowCore } from '../flow-core';
import type {
  Edge,
  FlowState,
  FlowStateUpdate,
  Metadata,
  MiddlewareChain,
  MiddlewareContext,
  MiddlewareHistoryUpdate,
  ModelActionType,
  Node,
} from '../types';
import { isSamePoint, isSameSize } from '../utils';

export class MiddlewareExecutor {
  readonly flowCore: FlowCore;
  readonly middlewareChain: MiddlewareChain;

  private history: MiddlewareHistoryUpdate[] = [];
  private initialState!: FlowState;
  private initialStateUpdate!: FlowStateUpdate;
  private modelActionType!: ModelActionType;
  private metadata: Metadata = { viewport: { x: 0, y: 0, scale: 1 } };
  private edgesMap = new Map<string, Edge>();
  private nodesMap = new Map<string, Node>();
  private addedNodesIds = new Set<string>();
  private removedNodesIds = new Set<string>();
  private addedEdgesIds = new Set<string>();
  private removedEdgesIds = new Set<string>();
  private updatedPropsToNodeIds = new Map<string, Set<string>>();
  private updatedPropsToEdgeIds = new Map<string, Set<string>>();
  private updatedNodeIdsToProps = new Map<string, Set<string>>();
  private updatedEdgeIdsToProps = new Map<string, Set<string>>();
  private updatedMetadataProps = new Set<keyof Metadata>();

  constructor(flowCore: FlowCore, middlewareChain: MiddlewareChain) {
    this.flowCore = flowCore;
    this.middlewareChain = middlewareChain;
  }

  async run(
    initialState: FlowState,
    stateUpdate: FlowStateUpdate,
    modelActionType: ModelActionType
  ): Promise<FlowState | undefined> {
    this.initialState = initialState;
    this.modelActionType = modelActionType;
    this.metadata = initialState.metadata;
    this.nodesMap = new Map(initialState.nodes.map((node) => [node.id, node]));
    this.edgesMap = new Map(initialState.edges.map((edge) => [edge.id, edge]));
    this.initialStateUpdate = stateUpdate;
    this.applyStateUpdate(stateUpdate);
    return this.resolveMiddlewares();
  }

  helpers = () => ({
    checkIfNodeChanged: (id: string) => this.updatedNodeIdsToProps.has(id),
    checkIfEdgeChanged: (id: string) => this.updatedEdgeIdsToProps.has(id),
    checkIfNodeAdded: (id: string) => this.addedNodesIds.has(id),
    checkIfNodeRemoved: (id: string) => this.removedNodesIds.has(id),
    checkIfEdgeAdded: (id: string) => this.addedEdgesIds.has(id),
    checkIfEdgeRemoved: (id: string) => this.removedEdgesIds.has(id),
    checkIfAnyNodePropsChanged: (props: string[]) => props.some((prop) => this.updatedPropsToNodeIds.has(prop)),
    checkIfAnyEdgePropsChanged: (props: string[]) => props.some((prop) => this.updatedPropsToEdgeIds.has(prop)),
    checkIfMetadataPropsChanged: (props: string[]) => props.some((prop) => this.updatedMetadataProps.has(prop)),
    anyNodesAdded: () => this.addedNodesIds.size > 0,
    anyEdgesAdded: () => this.addedEdgesIds.size > 0,
    anyNodesRemoved: () => this.removedNodesIds.size > 0,
    anyEdgesRemoved: () => this.removedEdgesIds.size > 0,
  });

  private getState = (): FlowState => ({
    nodes: Array.from(this.nodesMap.values()),
    edges: Array.from(this.edgesMap.values()),
    metadata: this.metadata,
  });

  private getContext = (): MiddlewareContext => ({
    state: this.getState(),
    nodesMap: this.nodesMap,
    edgesMap: this.edgesMap,
    initialState: this.initialState,
    modelActionType: this.modelActionType,
    flowCore: this.flowCore,
    helpers: this.helpers(),
    history: this.history,
    initialUpdate: this.initialStateUpdate,
  });

  private resolveMiddlewares = (): Promise<FlowState | undefined> => {
    return new Promise<FlowState | undefined>((finalResolve) => {
      const resolvers: ((state: FlowState) => void)[] = [];
      const middlewaresExecutedIndexes = new Set<number>();

      const dispatch = (i: number) =>
        new Promise<FlowState>((resolve) => {
          const middleware = this.middlewareChain[i];

          if (!middleware) {
            const state = this.getState();
            finalResolve(state);
            while (resolvers.length > 0) {
              resolvers.pop()?.(state);
            }
            return;
          }

          if (middlewaresExecutedIndexes.has(i)) {
            throw new Error(`Middleware ${middleware.name} executed next() multiple times`);
          }
          middlewaresExecutedIndexes.add(i);

          resolvers.push(resolve);

          const next = async (stateUpdate?: FlowStateUpdate) => {
            if (stateUpdate && Object.keys(stateUpdate).length > 0) {
              this.applyStateUpdate(stateUpdate, middleware.name);
            }
            const state = await dispatch(i + 1);
            return state;
          };
          const cancel = () => {
            while (resolvers.length > 0) {
              resolvers.pop()?.(this.initialState);
            }
            finalResolve(undefined);
          };

          middleware.execute(this.getContext(), next, cancel);
        });

      dispatch(0);
    });
  };

  private applyStateUpdate = (stateUpdate: FlowStateUpdate, middlewareName?: string) => {
    if (middlewareName) {
      this.history.push({ name: middlewareName, stateUpdate });
    }
    stateUpdate.nodesToAdd?.forEach((node) => this.addNode(node));
    stateUpdate.edgesToAdd?.forEach((edge) => this.addEdge(edge));
    stateUpdate.edgesToRemove?.forEach((id) => this.removeEdge(id));
    stateUpdate.nodesToRemove?.forEach((id) => this.removeNode(id));
    stateUpdate.nodesToUpdate?.forEach((node) => this.updateNode(node));
    stateUpdate.edgesToUpdate?.forEach((edge) => this.updateEdge(edge));

    if (stateUpdate.metadataUpdate) {
      Object.keys(stateUpdate.metadataUpdate ?? {}).forEach((key) => {
        this.updatedMetadataProps.add(key as keyof Metadata);
      });
      this.metadata = { ...this.metadata, ...stateUpdate.metadataUpdate };
    }
  };

  private removeNode = (id: string) => {
    this.nodesMap.delete(id);
    this.removedNodesIds.add(id);
    this.addedNodesIds.delete(id);
  };

  private removeEdge = (id: string) => {
    this.edgesMap.delete(id);
    this.removedEdgesIds.add(id);
    this.addedEdgesIds.delete(id);
  };

  private addEdge = (edge: Edge) => {
    this.edgesMap.set(edge.id, edge);
    this.addedEdgesIds.add(edge.id);
    this.removedEdgesIds.delete(edge.id);
  };

  private addNode = (node: Node) => {
    this.nodesMap.set(node.id, node);
    this.addedNodesIds.add(node.id);
    this.removedNodesIds.delete(node.id);
  };

  private updateNode = ({ id, ...node }: Partial<Node> & { id: Node['id'] }) => {
    const finalUpdate: Partial<Node> = {};
    const prevNode = this.nodesMap.get(id);
    if (!prevNode) {
      return;
    }
    Object.entries(node).forEach(([key, value]) => {
      if (key === 'position') {
        if (!isSamePoint(prevNode.position, value as Node['position'])) {
          finalUpdate.position = value as Node['position'];
          this.updateNodeProp(id, 'position');
        }
      } else if (key === 'size') {
        if (!isSameSize(prevNode.size, value as Node['size'])) {
          finalUpdate.size = value as Node['size'];
          this.updateNodeProp(id, 'size');
        }
      } else if (prevNode[key as keyof Node] !== value) {
        (finalUpdate as Record<string, unknown>)[key] = value;
        this.updateNodeProp(id, key as keyof Node);
      }
    });
    if (Object.keys(finalUpdate).length > 0) {
      this.nodesMap.set(id, { ...prevNode, ...finalUpdate });
    }
  };

  private updateNodeProp = (id: string, propName: keyof Node) => {
    if (!this.updatedPropsToNodeIds.has(propName)) {
      this.updatedPropsToNodeIds.set(propName, new Set([]));
    }
    this.updatedPropsToNodeIds.get(propName)!.add(id);

    if (!this.updatedNodeIdsToProps.has(id)) {
      this.updatedNodeIdsToProps.set(id, new Set([]));
    }
    this.updatedNodeIdsToProps.get(id)!.add(propName);
  };

  private updateEdge = ({ id, ...edge }: Partial<Edge> & { id: Edge['id'] }) => {
    const finalUpdate: Partial<Edge> = {};
    const prevEdge = this.edgesMap.get(id);
    if (!prevEdge) {
      return;
    }
    Object.entries(edge).forEach(([key, value]) => {
      if (key === 'targetPosition') {
        if (!isSamePoint(prevEdge.targetPosition, value as Edge['targetPosition'])) {
          finalUpdate.targetPosition = value as Edge['targetPosition'];
          this.updateEdgeProp(id, 'targetPosition');
        }
      } else if (key === 'sourcePosition') {
        if (!isSamePoint(prevEdge.sourcePosition, value as Edge['sourcePosition'])) {
          finalUpdate.sourcePosition = value as Edge['sourcePosition'];
          this.updateEdgeProp(id, 'sourcePosition');
        }
      } else if (prevEdge[key as keyof Edge] !== value) {
        (finalUpdate as Record<string, unknown>)[key] = value;
        this.updateEdgeProp(id, key as keyof Edge);
      }
    });
    if (Object.keys(finalUpdate).length > 0) {
      this.edgesMap.set(id, { ...prevEdge, ...finalUpdate });
    }
  };

  private updateEdgeProp = (id: string, propName: keyof Edge) => {
    if (!this.updatedPropsToEdgeIds.has(propName)) {
      this.updatedPropsToEdgeIds.set(propName, new Set([]));
    }
    this.updatedPropsToEdgeIds.get(propName)!.add(id);

    if (!this.updatedEdgeIdsToProps.has(id)) {
      this.updatedEdgeIdsToProps.set(id, new Set([]));
    }
    this.updatedEdgeIdsToProps.get(id)!.add(propName);
  };
}
