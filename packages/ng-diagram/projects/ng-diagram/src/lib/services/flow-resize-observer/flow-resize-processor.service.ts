import { Injectable, inject } from '@angular/core';
import { Point, Port, Size } from '../../../core/src';
import { toPortUpdates } from '../../../core/src/port-batch-processor/port-batch-processor';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { UpdatePortsService } from '../update-ports/update-ports.service';
import {
  BatchResizeObserverService,
  type CapturedResizeEntry,
  type ObservedElementMetadata,
} from './batched-resize-observer.service';

const UNKNOWN_ELEMENT_TYPE_ERROR = (elementType: string) =>
  `[ngDiagram] Unknown element type: "${elementType}"

Expected types: 'port', 'edge-label', 'node'

This indicates a programming error in the resize observer metadata configuration.
Check that elements are registered with the correct type.`;

interface ProcessedEntry {
  entry: ResizeObserverEntry;
  metadata: ObservedElementMetadata;
}

// Only the node path consumes resizingNodeId — ports and labels have no
// suppression rule tied to the resize gesture.
interface NodeProcessedEntry extends ProcessedEntry {
  resizingNodeId: string | undefined;
}

@Injectable()
export class FlowResizeBatchProcessorService {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly updatePortsService = inject(UpdatePortsService);
  private readonly batchResizeObserver = inject(BatchResizeObserverService);

  private isInitialized = false;

  /**
   * Initialize the service when FlowCore is available
   */
  initialize(): void {
    if (this.isInitialized) return;

    this.batchResizeObserver.configure({
      processBatch: (entries) => this.processAllResizes(entries),
      // Sampled at delivery time — processing happens two rAFs later, when a
      // fast pointer release may already have ended the gesture.
      activeResizeNodeId: () => this.flowCoreProvider.provide().actionStateManager.resize?.resizingNode.id,
      // Signal the measurement tracker when ResizeObserver fires, before the
      // double-RAF batch processing. This extends the tracker's discovery
      // window so it waits for the measurements to arrive.
      onObserverActivity: (metadataList) => {
        const tracker = this.flowCoreProvider.provide().measurementTracker;
        for (const metadata of metadataList) {
          if (metadata.type === 'port' || metadata.type === 'node') {
            tracker.signalObserverActivity(`node:${metadata.nodeId}`);
          } else if (metadata.type === 'edge-label') {
            tracker.signalObserverActivity(`edge:${metadata.edgeId}`);
          }
        }
      },
    });

    this.isInitialized = true;
  }

  /**
   * Re-measures the resized node once when its gesture ends. Measurements of
   * that node captured during the gesture are dropped (see processNodeBatch),
   * and when CSS (e.g. `min-width`) stops the DOM from following the model
   * size, ResizeObserver never fires again on its own — without this
   * re-measure the model would keep a size the DOM never reached. Must be
   * called after each FlowCore (re)initialization — the listener dies with
   * the replaced EventManager.
   */
  watchResizeGestureEnd(): void {
    const flowCore = this.flowCoreProvider.provide();
    let lastResizingNodeId: string | undefined;
    flowCore.eventManager.on('actionStateChanged', ({ actionState }) => {
      const currentId = actionState.resize?.resizingNode.id;
      if (lastResizingNodeId !== undefined && currentId === undefined) {
        this.batchResizeObserver.invalidateNode(lastResizingNodeId);
      }
      lastResizingNodeId = currentId;
    });
  }

  /**
   * Main batch processor - handles all resize events in one go
   */
  private processAllResizes(entries: CapturedResizeEntry[]): void {
    // Ensure service is initialized
    if (!this.isInitialized) {
      console.warn('FlowResizeBatchProcessorService not initialized yet, skipping resize processing');
      return;
    }

    const portEntries: ProcessedEntry[] = [];
    const edgeLabelEntries: ProcessedEntry[] = [];
    const nodeEntries: NodeProcessedEntry[] = [];

    // Categorize entries by type
    for (const { entry, resizingNodeId } of entries) {
      const metadata = this.batchResizeObserver.getMetadata(entry.target);

      if (!metadata) continue;

      switch (metadata.type) {
        case 'port':
          portEntries.push({ metadata, entry });
          break;
        case 'edge-label':
          edgeLabelEntries.push({ metadata, entry });
          break;
        case 'node':
          nodeEntries.push({ metadata, entry, resizingNodeId });
          break;
        default:
          throw new Error(UNKNOWN_ELEMENT_TYPE_ERROR((metadata as ObservedElementMetadata).type));
      }
    }

    // Process all ports together
    if (portEntries.length > 0) {
      this.processPortBatch(portEntries);
    }

    // Process all edge labels together
    if (edgeLabelEntries.length > 0) {
      this.processEdgeLabelBatch(edgeLabelEntries);
    }

    if (nodeEntries.length > 0) {
      this.processNodeBatch(nodeEntries);
    }
  }

  /**
   * Process all port resize events
   */
  private processPortBatch(entries: ProcessedEntry[]): void {
    const flowCore = this.flowCoreProvider.provide();
    const measuredPortsMaps = new Map<string, Map<string, Port>>();
    const updatesByNode = new Map<string, { id: string; size: Size; position: Point }[]>();

    for (const { entry, metadata } of entries) {
      if (metadata?.type !== 'port') continue;

      const size = this.getBorderBoxSize(entry);
      if (!size) continue;

      const portData = this.updatePortsService.getPortData(entry.target as HTMLElement);
      if (!portData) continue;

      const node = flowCore.getNodeById(metadata.nodeId);
      if (!node) continue;

      if (!measuredPortsMaps.has(metadata.nodeId)) {
        measuredPortsMaps.set(metadata.nodeId, new Map((node.measuredPorts ?? []).map((p) => [p.id, p])));
      }
      const port = measuredPortsMaps.get(metadata.nodeId)!.get(metadata.portId);

      if (
        port?.size &&
        !this.isSizeChanged(port.size, size) &&
        port?.position &&
        !this.isPositionChanged(port.position, portData.position)
      ) {
        continue;
      }

      if (!updatesByNode.has(metadata.nodeId)) {
        updatesByNode.set(metadata.nodeId, []);
      }

      updatesByNode.get(metadata.nodeId)!.push({
        id: metadata.portId,
        size,
        position: portData.position,
      });
    }

    updatesByNode.forEach((ports, nodeId) => {
      flowCore.updater.applyPortChanges(nodeId, toPortUpdates(ports));
    });
  }

  /**
   * Process all node resize events
   */
  private processNodeBatch(entries: NodeProcessedEntry[]): void {
    const flowCore = this.flowCoreProvider.provide();
    // Sampled at processing time — NOT interchangeable with the per-entry
    // resizingNodeId, which was sampled two rAFs earlier at ResizeObserver
    // delivery; a fast pointer release ends the gesture in between.
    const isResizingNow = flowCore.actionStateManager.isResizing();
    const nodeSizeUpdates: { id: string; size: Size }[] = [];

    for (const { entry, metadata, resizingNodeId } of entries) {
      if (metadata?.type !== 'node') continue;

      const size = this.getBorderBoxSize(entry);
      if (!size) continue;

      const node = flowCore.getNodeById(metadata.nodeId);
      if (!node) continue;

      // While a node is being resized, the gesture — not the DOM — is the
      // source of truth for its size, and this batch may run after the gesture
      // ended and after writes that followed it (e.g. a middleware reverting
      // the size on resizeNodeStop). A measurement taken during the node's own
      // gesture must not overwrite those; the node is re-measured once the
      // gesture ends (watchResizeGestureEnd).
      if (node.size && resizingNodeId === metadata.nodeId) {
        continue;
      }

      if (node.size && !this.isSizeChanged(node.size, size)) {
        continue;
      }

      nodeSizeUpdates.push({ id: metadata.nodeId, size });

      // Skip port measurement during active resize — NgDiagramNodeComponent.syncPorts() handles it
      if (!isResizingNow) {
        const portsData = this.updatePortsService.getNodePortsData(metadata.nodeId);
        flowCore.updater.applyPortChanges(metadata.nodeId, toPortUpdates(portsData));
      }
    }

    if (nodeSizeUpdates.length > 0) {
      flowCore.updater.applyNodeSizes(nodeSizeUpdates);
    }
  }

  /**
   * Process all edge label resize events
   */
  private processEdgeLabelBatch(entries: ProcessedEntry[]): void {
    const flowCore = this.flowCoreProvider.provide();
    const measuredLabelsMaps = new Map<string, Map<string, Size | undefined>>();
    const updatesByEdge = new Map<string, { labelId: string; size: Size }[]>();

    for (const { entry, metadata } of entries) {
      if (metadata?.type !== 'edge-label') continue;

      const size = this.getBorderBoxSize(entry);
      if (!size) continue;

      const edge = flowCore.getEdgeById(metadata.edgeId);
      if (!edge) continue;

      if (!measuredLabelsMaps.has(metadata.edgeId)) {
        measuredLabelsMaps.set(metadata.edgeId, new Map((edge.measuredLabels ?? []).map((l) => [l.id, l.size])));
      }
      const currentSize = measuredLabelsMaps.get(metadata.edgeId)!.get(metadata.labelId);

      if (currentSize && !this.isSizeChanged(currentSize, size)) {
        continue;
      }

      if (!updatesByEdge.has(metadata.edgeId)) {
        updatesByEdge.set(metadata.edgeId, []);
      }

      updatesByEdge.get(metadata.edgeId)!.push({
        labelId: metadata.labelId,
        size,
      });
    }

    updatesByEdge.forEach((labels, edgeId) => {
      flowCore.updater.applyEdgeLabelChanges(
        edgeId,
        labels.map(({ labelId, size }) => ({ labelId, labelChanges: { size } }))
      );
    });
  }

  /**
   * Get the border box size of an element
   * @param entry Resize observer entry
   * @returns Border box size or null if not available
   */
  private getBorderBoxSize(entry: ResizeObserverEntry): Size | null {
    const [borderBox] = entry.borderBoxSize;

    if (!borderBox) return null;

    return { width: borderBox.inlineSize, height: borderBox.blockSize };
  }

  /**
   * Check if the size has changed by more than 1px
   * Because of different render engines we skip updates if the size has less than 1px difference
   * @param currentSize Current size
   * @param newSize New size
   * @returns True if the size has changed by more than 1px, false otherwise
   */
  private isSizeChanged(currentSize: Size, newSize: Size) {
    return Math.abs(currentSize.width - newSize.width) > 1 || Math.abs(currentSize.height - newSize.height) > 1;
  }

  /**
   * Check if the position has changed by more than 1px
   * @param currentPosition Current position
   * @param newPosition New position
   * @returns True if the position has changed by more than 1px, false otherwise
   */
  private isPositionChanged(currentPosition: Point, newPosition: Point) {
    return Math.abs(currentPosition.x - newPosition.x) > 1 || Math.abs(currentPosition.y - newPosition.y) > 1;
  }
}
