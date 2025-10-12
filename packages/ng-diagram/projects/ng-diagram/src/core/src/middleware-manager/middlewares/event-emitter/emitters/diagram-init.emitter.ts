import type { EventManager } from '../../../../event-manager/event-manager';
import type { DiagramInitEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import { isValidPosition, isValidSize } from '../../../../utils/measurement-validation';
import type { EventEmitter } from './event-emitter.interface';

/**
 * Tracks unmeasured items and emits the diagramInit event when all measurements are complete.
 *
 * - When 'init' fires, most items should already be measured thanks to the InitUpdater
 * - But late arrivals (race condition during finish) may still be processing
 * - So we still need to track and wait for any remaining unmeasured items
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

    if (this.areAllMeasured()) {
      this.emitInitEvent(context, eventManager);
    }
  }

  private handleUpdate(context: MiddlewareContext, eventManager: EventManager): void {
    if (!this.initialized || this.initEventEmitted) {
      return;
    }

    const { modelActionType, initialUpdate, nodesMap, edgesMap } = context;

    if (modelActionType === 'updateNode') {
      this.processNodeUpdates(initialUpdate, nodesMap);
    } else if (modelActionType === 'updateEdge') {
      this.processEdgeUpdates(initialUpdate, edgesMap);
    }

    if (this.areAllMeasured()) {
      this.emitInitEvent(context, eventManager);
    }
  }

  private collectUnmeasuredItems(nodesMap: Map<string, Node>, edgesMap: Map<string, Edge>): void {
    this.unmeasuredNodes.clear();
    this.unmeasuredNodePorts.clear();
    this.unmeasuredEdgeLabels.clear();

    for (const [nodeId, node] of nodesMap) {
      if (!isValidSize(node.size)) {
        this.unmeasuredNodes.add(nodeId);
      }

      for (const port of node.measuredPorts ?? []) {
        if (!isValidSize(port.size) || !isValidPosition(port.position)) {
          this.unmeasuredNodePorts.add(`${nodeId}:${port.id}`);
        }
      }
    }

    for (const [edgeId, edge] of edgesMap) {
      for (const label of edge.measuredLabels ?? []) {
        if (!isValidSize(label.size) || !isValidPosition(label.position)) {
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

      if (this.unmeasuredNodes.has(nodeUpdate.id) && isValidSize(nodeUpdate.size)) {
        this.unmeasuredNodes.delete(nodeUpdate.id);
      }

      if (nodeUpdate.measuredPorts) {
        for (const port of nodeUpdate.measuredPorts) {
          const portKey = `${nodeUpdate.id}:${port.id}`;
          if (this.unmeasuredNodePorts.has(portKey) && isValidSize(port.size) && isValidPosition(port.position)) {
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
          if (this.unmeasuredEdgeLabels.has(labelKey) && isValidSize(label.size) && isValidPosition(label.position)) {
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
