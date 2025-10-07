import type { EventManager } from '../../../../event-manager/event-manager';
import type { DiagramInitEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

/**
 * Tracks unmeasured items and emits the diagramInit event when all measurements are complete.
 */
export class DiagramInitEmitter implements EventEmitter {
  name = 'DiagramInitEmitter';

  private unmeasuredNodes = new Set<string>();
  private unmeasuredNodePorts = new Set<string>();
  private unmeasuredEdgeLabels = new Set<string>();
  private initialized = false;
  private initEventEmitted = false;

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    const { modelActionType } = context;

    switch (modelActionType) {
      case 'init':
        this.handleInit(context, eventManager);
        break;
      case 'updateNode':
      case 'updateEdge':
        this.handleUpdate(context, eventManager);
        break;
    }
  }

  private handleInit(context: MiddlewareContext, eventManager: EventManager): void {
    const { nodesMap, edgesMap } = context;

    this.collectUnmeasuredItems(nodesMap, edgesMap);
    this.initialized = true;

    console.log('[DiagramInitEmitter] handleInit, unmeasured:', {
      nodes: this.unmeasuredNodes.size,
      ports: this.unmeasuredNodePorts.size,
      labels: this.unmeasuredEdgeLabels.size,
      unmeasuredNodeIds: Array.from(this.unmeasuredNodes),
      unmeasuredPortIds: Array.from(this.unmeasuredNodePorts),
      unmeasuredLabelIds: Array.from(this.unmeasuredEdgeLabels),
    });

    if (this.areAllMeasured()) {
      this.emitInitEvent(context, eventManager);
    }
  }

  private handleUpdate(context: MiddlewareContext, eventManager: EventManager): void {
    if (!this.initialized || this.initEventEmitted) {
      return;
    }

    const { modelActionType, initialUpdate, nodesMap, edgesMap } = context;

    console.log('[DiagramInitEmitter] handleUpdate, action:', modelActionType, 'unmeasured before:', {
      nodes: this.unmeasuredNodes.size,
      ports: this.unmeasuredNodePorts.size,
      labels: this.unmeasuredEdgeLabels.size,
    });

    if (modelActionType === 'updateNode') {
      this.processNodeUpdates(initialUpdate, nodesMap);
    } else if (modelActionType === 'updateEdge') {
      this.processEdgeUpdates(initialUpdate, edgesMap);
    }

    console.log('[DiagramInitEmitter] handleUpdate, unmeasured after:', {
      nodes: this.unmeasuredNodes.size,
      ports: this.unmeasuredNodePorts.size,
      labels: this.unmeasuredEdgeLabels.size,
    });

    if (this.areAllMeasured()) {
      console.log('[DiagramInitEmitter] All measured! Emitting diagramInit');
      this.emitInitEvent(context, eventManager);
    }
  }

  private collectUnmeasuredItems(nodesMap: Map<string, Node>, edgesMap: Map<string, Edge>): void {
    this.unmeasuredNodes.clear();
    this.unmeasuredNodePorts.clear();
    this.unmeasuredEdgeLabels.clear();

    for (const [nodeId, node] of nodesMap) {
      if (!node.size?.width || !node.size?.height) {
        this.unmeasuredNodes.add(nodeId);
      }

      for (const port of node.measuredPorts ?? []) {
        if (!port.position?.x || !port.position?.y || !port.size?.width || !port.size?.height) {
          this.unmeasuredNodePorts.add(`${nodeId}:${port.id}`);
        }
      }
    }

    for (const [edgeId, edge] of edgesMap) {
      for (const label of edge.measuredLabels ?? []) {
        if (!label.position?.x || !label.position?.y || !label.size?.width || !label.size?.height) {
          this.unmeasuredEdgeLabels.add(`${edgeId}:${label.id}`);
        }
      }
    }
  }

  private processNodeUpdates(initialUpdate: MiddlewareContext['initialUpdate'], nodesMap: Map<string, Node>): void {
    if (!initialUpdate?.nodesToUpdate?.length) {
      return;
    }

    for (const nodeUpdate of initialUpdate.nodesToUpdate) {
      if (!nodesMap.has(nodeUpdate.id)) {
        continue;
      }

      if (this.unmeasuredNodes.has(nodeUpdate.id) && nodeUpdate.size?.width && nodeUpdate.size?.height) {
        this.unmeasuredNodes.delete(nodeUpdate.id);
      }

      if (nodeUpdate.measuredPorts) {
        for (const port of nodeUpdate.measuredPorts) {
          const portKey = `${nodeUpdate.id}:${port.id}`;
          if (
            this.unmeasuredNodePorts.has(portKey) &&
            port.position?.x !== undefined &&
            port.position?.y !== undefined &&
            port.size?.width !== undefined &&
            port.size?.height !== undefined
          ) {
            this.unmeasuredNodePorts.delete(portKey);
          }
        }
      }
    }
  }

  private processEdgeUpdates(initialUpdate: MiddlewareContext['initialUpdate'], edgesMap: Map<string, Edge>): void {
    if (!initialUpdate?.edgesToUpdate?.length) {
      return;
    }

    for (const edgeUpdate of initialUpdate.edgesToUpdate) {
      if (!edgesMap.has(edgeUpdate.id)) {
        continue;
      }

      if (edgeUpdate.measuredLabels) {
        for (const label of edgeUpdate.measuredLabels) {
          const labelKey = `${edgeUpdate.id}:${label.id}`;
          if (
            this.unmeasuredEdgeLabels.has(labelKey) &&
            label.position?.x !== undefined &&
            label.position?.y !== undefined &&
            label.size?.width !== undefined &&
            label.size?.height !== undefined
          ) {
            this.unmeasuredEdgeLabels.delete(labelKey);
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

  private emitInitEvent(context: MiddlewareContext, eventManager: EventManager): void {
    const { nodesMap, edgesMap } = context;
    const event: DiagramInitEvent = {
      nodes: Array.from(nodesMap.values()),
      edges: Array.from(edgesMap.values()),
      viewport: context.state.metadata.viewport,
    };

    eventManager.deferredEmit('diagramInit', event);
    this.initEventEmitted = true;
  }
}
