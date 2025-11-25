import { Injectable, inject } from '@angular/core';
import { Point, Port, Size } from '../../../core/src';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { UpdatePortsService } from '../update-ports/update-ports.service';
import { BatchResizeObserverService, type ObservedElementMetadata } from './batched-resize-observer.service';

const UNKNOWN_ELEMENT_TYPE_ERROR = (elementType: string) =>
  `[ngDiagram] Unknown element type: "${elementType}"

Expected types: 'port', 'edge-label', 'node'

This indicates a programming error in the resize observer metadata configuration.
Check that elements are registered with the correct type.`;

interface ProcessedEntry {
  entry: ResizeObserverEntry;
  metadata: ObservedElementMetadata;
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

    // Register this service as the batch processor
    this.batchResizeObserver.setBatchProcessor((entries) => {
      this.processAllResizes(entries);
    });

    this.isInitialized = true;
  }

  /**
   * Main batch processor - handles all resize events in one go
   */
  private processAllResizes(entries: ResizeObserverEntry[]): void {
    // Ensure service is initialized
    if (!this.isInitialized) {
      console.warn('FlowResizeBatchProcessorService not initialized yet, skipping resize processing');
      return;
    }

    const portEntries: ProcessedEntry[] = [];
    const edgeLabelEntries: ProcessedEntry[] = [];
    const nodeEntries: ProcessedEntry[] = [];

    // Categorize entries by type
    for (const entry of entries) {
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
          nodeEntries.push({ metadata, entry });
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
    const updatesByNode = new Map<
      string,
      {
        id: string;
        size: Size;
        position: Point;
      }[]
    >();

    for (const { entry, metadata } of entries) {
      if (metadata?.type !== 'port') continue;

      const size = this.getBorderBoxSize(entry);
      if (!size) continue;

      const portData = this.updatePortsService.getPortData(entry.target as HTMLElement);
      if (!portData) continue;

      const node = flowCore.getNodeById(metadata.nodeId);
      if (!node) continue;

      const port = node.measuredPorts?.find((port: Port) => port.id === metadata.portId);
      const currentSize = port?.size;
      const currentPosition = port?.position;

      if (
        currentSize &&
        !this.isSizeChanged(currentSize, size) &&
        currentPosition &&
        !this.isPositionChanged(currentPosition, portData.position)
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
      flowCore.updater.applyPortsSizesAndPositions(nodeId, ports);
    });
  }

  /**
   * Process all node resize events
   */
  private processNodeBatch(entries: ProcessedEntry[]): void {
    const flowCore = this.flowCoreProvider.provide();

    for (const { entry, metadata } of entries) {
      if (metadata?.type !== 'node') continue;

      const size = this.getBorderBoxSize(entry);
      if (!size) continue;

      const currentSize = flowCore.getNodeById(metadata.nodeId)?.size;
      if (currentSize && !this.isSizeChanged(currentSize, size)) {
        continue;
      }

      flowCore.updater.applyNodeSize(metadata.nodeId, size);

      // Skip port measurement during active resize performed by user to avoid redundant updates
      // NgDiagramNodeComponent.syncPorts() handles it
      if (!flowCore.actionStateManager.isResizing()) {
        const portsData = this.updatePortsService.getNodePortsData(metadata.nodeId);
        flowCore.updater.applyPortsSizesAndPositions(metadata.nodeId, portsData);
      }
    }
  }

  /**
   * Process all edge label resize events
   */
  private processEdgeLabelBatch(entries: ProcessedEntry[]): void {
    const flowCore = this.flowCoreProvider.provide();

    const updatesByEdge = new Map<
      string,
      {
        labelId: string;
        size: Size;
      }[]
    >();

    for (const { entry, metadata } of entries) {
      if (metadata?.type !== 'edge-label') continue;

      const size = this.getBorderBoxSize(entry);
      if (!size) continue;

      const edge = flowCore.getEdgeById(metadata.edgeId);
      if (!edge) continue;

      const currentSize = edge.measuredLabels?.find((label) => label.id === metadata.labelId)?.size;
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
      labels.forEach(({ labelId, size }) => {
        flowCore.updater.applyEdgeLabelSize(edgeId, labelId, size);
      });
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
