import type { EventManager } from '../../../../event-manager/event-manager';
import type { DiagramInitEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class DiagramInitEmitter implements EventEmitter {
  name = 'DiagramInitEmitter';

  private unmeasuredNodes = new Set<string>();
  private unmeasuredNodePorts = new Set<string>();
  private unmeasuredEdgeLabels = new Set<string>();
  private initialized = false;
  private initEventEmitted = false;

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    const { modelActionType, nodesMap, edgesMap } = context;

    if (modelActionType === 'init') {
      this.handleInit(nodesMap, edgesMap);
      this.initialized = true;
      return;
    }

    if (!this.initialized || this.initEventEmitted) {
      return;
    }

    if (modelActionType === 'updateNode') {
      this.handleUpdateNode(context);
    } else if (modelActionType === 'updateEdge') {
      this.handleUpdateEdge(context);
    }

    if (this.areAllMeasured() && !this.initEventEmitted) {
      const nodes = Array.from(nodesMap.values());
      const edges = Array.from(edgesMap.values());
      const viewport = context.state.metadata.viewport;

      const event: DiagramInitEvent = {
        nodes,
        edges,
        viewport,
      };

      eventManager.emit('diagramInit', event);
      this.initEventEmitted = true;
    }
  }

  private handleInit(nodesMap: Map<string, Node>, edgesMap: Map<string, Edge>): void {
    this.unmeasuredNodes.clear();
    this.unmeasuredNodePorts.clear();
    this.unmeasuredEdgeLabels.clear();

    for (const [nodeId, node] of nodesMap) {
      if (!node.size || node.size.width === undefined || node.size.height === undefined) {
        this.unmeasuredNodes.add(nodeId);
      }

      if (node.measuredPorts) {
        for (const port of node.measuredPorts) {
          if (
            !port.position ||
            port.position.x === undefined ||
            port.position.y === undefined ||
            !port.size ||
            port.size.width === undefined ||
            port.size.height === undefined
          ) {
            this.unmeasuredNodePorts.add(`${nodeId}:${port.id}`);
          }
        }
      }
    }

    for (const [edgeId, edge] of edgesMap) {
      if (edge.measuredLabels) {
        for (const label of edge.measuredLabels) {
          if (
            !label.position ||
            label.position.x === undefined ||
            label.position.y === undefined ||
            !label.size ||
            label.size.width === undefined ||
            label.size.height === undefined
          ) {
            this.unmeasuredEdgeLabels.add(`${edgeId}:${label.id}`);
          }
        }
      }
    }
  }

  private handleUpdateNode(context: MiddlewareContext): void {
    const { initialUpdate, nodesMap } = context;

    if (!initialUpdate || !initialUpdate.nodesToUpdate || initialUpdate.nodesToUpdate.length === 0) {
      return;
    }

    for (const nodeUpdate of initialUpdate.nodesToUpdate) {
      const nodeId = nodeUpdate.id;
      const currentNode = nodesMap.get(nodeId);

      if (!currentNode) {
        continue;
      }

      if (
        nodeUpdate.size &&
        nodeUpdate.size.width !== undefined &&
        nodeUpdate.size.height !== undefined &&
        this.unmeasuredNodes.has(nodeId)
      ) {
        this.unmeasuredNodes.delete(nodeId);
      }

      if (nodeUpdate.measuredPorts) {
        for (const portUpdate of nodeUpdate.measuredPorts) {
          const portKey = `${nodeId}:${portUpdate.id}`;
          if (this.unmeasuredNodePorts.has(portKey)) {
            if (
              portUpdate.position &&
              portUpdate.position.x !== undefined &&
              portUpdate.position.y !== undefined &&
              portUpdate.size &&
              portUpdate.size.width !== undefined &&
              portUpdate.size.height !== undefined
            ) {
              this.unmeasuredNodePorts.delete(portKey);
            }
          }
        }
      }
    }
  }

  private handleUpdateEdge(context: MiddlewareContext): void {
    const { initialUpdate, edgesMap } = context;

    if (!initialUpdate || !initialUpdate.edgesToUpdate || initialUpdate.edgesToUpdate.length === 0) {
      return;
    }

    for (const edgeUpdate of initialUpdate.edgesToUpdate) {
      const edgeId = edgeUpdate.id;
      const currentEdge = edgesMap.get(edgeId);

      if (!currentEdge) {
        continue;
      }

      if (edgeUpdate.measuredLabels) {
        for (const labelUpdate of edgeUpdate.measuredLabels) {
          const labelKey = `${edgeId}:${labelUpdate.id}`;
          if (this.unmeasuredEdgeLabels.has(labelKey)) {
            if (
              labelUpdate.position &&
              labelUpdate.position.x !== undefined &&
              labelUpdate.position.y !== undefined &&
              labelUpdate.size &&
              labelUpdate.size.width !== undefined &&
              labelUpdate.size.height !== undefined
            ) {
              this.unmeasuredEdgeLabels.delete(labelKey);
            }
          }
        }
      }
    }
  }

  private areAllMeasured(): boolean {
    return (
      this.unmeasuredNodes.size === 0 && this.unmeasuredNodePorts.size === 0 && this.unmeasuredEdgeLabels.size === 0
    );
  }
}
