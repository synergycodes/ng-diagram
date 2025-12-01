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
 * - Safety hatch: If measurements don't complete within timeout, emit anyway with warning
 */
export class DiagramInitEmitter implements EventEmitter {
  name = 'DiagramInitEmitter';

  private unmeasuredNodes = new Set<string>();
  private unmeasuredNodePorts = new Set<string>();
  private unmeasuredEdgeLabels = new Set<string>();
  private initialized = false;
  private initEventEmitted = false;
  private safetyHatchTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly SAFETY_HATCH_TIMEOUT_MS = 2000;

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
    this.initialized = true;

    const { nodesMap, edgesMap, initialUpdate } = context;

    // With virtualization, only track rendered nodes/edges for measurement
    // Non-rendered nodes won't be measured until they enter the viewport
    this.collectUnmeasuredItems(nodesMap, edgesMap, initialUpdate.renderedNodeIds, initialUpdate.renderedEdgeIds);

    if (this.areAllMeasured()) {
      this.emitInitEvent(context, eventManager);
    } else {
      this.restartSafetyHatchTimeout(context, eventManager);
    }
  }

  private handleUpdate(context: MiddlewareContext, eventManager: EventManager): void {
    if (!this.initialized || this.initEventEmitted) {
      return;
    }

    const { modelActionType, initialUpdate, nodesMap, edgesMap } = context;

    const previousUnmeasuredCount = this.countUnmeasuredItems();

    if (modelActionType === 'updateNode') {
      this.processNodeUpdates(initialUpdate, nodesMap);
    } else if (modelActionType === 'updateEdge') {
      this.processEdgeUpdates(initialUpdate, edgesMap);
    }

    const currentUnmeasuredCount = this.countUnmeasuredItems();

    if (currentUnmeasuredCount < previousUnmeasuredCount) {
      this.restartSafetyHatchTimeout(context, eventManager);
    }

    if (this.areAllMeasured()) {
      this.emitInitEvent(context, eventManager);
    }
  }

  private collectUnmeasuredItems(
    nodesMap: Map<string, Node>,
    edgesMap: Map<string, Edge>,
    renderedNodeIds?: string[],
    renderedEdgeIds?: string[]
  ): void {
    this.unmeasuredNodes.clear();
    this.unmeasuredNodePorts.clear();
    this.unmeasuredEdgeLabels.clear();

    // If renderedNodeIds provided (virtualization), only track those nodes
    // Otherwise track all nodes (no virtualization or fallback)
    const nodeIdsToTrack = renderedNodeIds ?? Array.from(nodesMap.keys());

    for (const nodeId of nodeIdsToTrack) {
      const node = nodesMap.get(nodeId);
      if (!node) continue;

      if (!isValidSize(node.size)) {
        this.unmeasuredNodes.add(nodeId);
      }

      for (const port of node.measuredPorts ?? []) {
        if (!isValidSize(port.size) || !isValidPosition(port.position)) {
          this.unmeasuredNodePorts.add(`${nodeId}:${port.id}`);
        }
      }
    }

    // If renderedEdgeIds provided (virtualization), only track those edges
    // Otherwise track all edges (no virtualization or fallback)
    const edgeIdsToTrack = renderedEdgeIds ?? Array.from(edgesMap.keys());

    for (const edgeId of edgeIdsToTrack) {
      const edge = edgesMap.get(edgeId);
      if (!edge) continue;

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

  private emitInitEvent(context: MiddlewareContext, eventManager: EventManager, useDeferred = true): void {
    this.clearSafetyHatchTimeout();

    const { nodesMap, edgesMap, initialUpdate } = context;
    const event: DiagramInitEvent = {
      // undefined means all nodes/edges are rendered (DirectRenderStrategy)
      // string[] means only those specific IDs are rendered (VirtualizedRenderStrategy)
      nodes: initialUpdate.renderedNodeIds
        ? Array.from(nodesMap.values()).filter((x) => initialUpdate.renderedNodeIds!.includes(x.id))
        : Array.from(nodesMap.values()),
      edges: initialUpdate.renderedEdgeIds
        ? Array.from(edgesMap.values()).filter((x) => initialUpdate.renderedEdgeIds!.includes(x.id))
        : Array.from(edgesMap.values()),
      viewport: context.state.metadata.viewport,
    };

    if (useDeferred) {
      eventManager.deferredEmit('diagramInit', event);
    } else {
      eventManager.emit('diagramInit', event);
    }
    this.initEventEmitted = true;
  }

  private restartSafetyHatchTimeout(context: MiddlewareContext, eventManager: EventManager): void {
    this.clearSafetyHatchTimeout();
    this.safetyHatchTimeoutId = setTimeout(() => {
      if (!this.initEventEmitted) {
        this.emitInitEventWithWarning(context, eventManager);
      }
    }, this.SAFETY_HATCH_TIMEOUT_MS);
  }

  private clearSafetyHatchTimeout(): void {
    if (this.safetyHatchTimeoutId !== null) {
      clearTimeout(this.safetyHatchTimeoutId);
      this.safetyHatchTimeoutId = null;
    }
  }

  private emitInitEventWithWarning(context: MiddlewareContext, eventManager: EventManager): void {
    const unmeasuredItems = {
      nodes: Array.from(this.unmeasuredNodes),
      nodePorts: Array.from(this.unmeasuredNodePorts),
      edgeLabels: Array.from(this.unmeasuredEdgeLabels),
    };

    const totalUnmeasured = this.countUnmeasuredItems();

    console.warn(
      `[DiagramInitEmitter] Measurement timeout reached from last measurement. Emitting diagramInit event anyway.`
    );
    console.warn(`Total unmeasured elements: ${totalUnmeasured}`);

    if (unmeasuredItems.nodes.length > 0) {
      console.warn(`Unmeasured nodes (${unmeasuredItems.nodes.length}):`, unmeasuredItems.nodes);
    }

    if (unmeasuredItems.nodePorts.length > 0) {
      console.warn(`Unmeasured node ports (${unmeasuredItems.nodePorts.length}):`, unmeasuredItems.nodePorts);
    }

    if (unmeasuredItems.edgeLabels.length > 0) {
      console.warn(`Unmeasured edge labels (${unmeasuredItems.edgeLabels.length}):`, unmeasuredItems.edgeLabels);
    }

    this.emitInitEvent(context, eventManager, false);
  }

  private countUnmeasuredItems() {
    return this.unmeasuredNodes.size + this.unmeasuredEdgeLabels.size + this.unmeasuredNodePorts.size;
  }
}
