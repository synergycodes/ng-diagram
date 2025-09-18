import { Injectable, inject } from '@angular/core';
import { Port } from '../../../core/src';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { UpdatePortsService } from '../update-ports/update-ports.service';
import { BatchResizeObserverService, type ObservedElementMetadata } from './batched-resize-observer.service';

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
          throw new Error('Unknown element type:', metadata);
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
        size: { width: number; height: number };
        position: { x: number; y: number };
      }[]
    >();

    for (const { entry, metadata } of entries) {
      if (metadata?.type !== 'port') continue;

      const size = this.getBorderBoxSize(entry);
      if (!size) continue;

      const { position } = this.updatePortsService.getPortData(entry.target as HTMLElement);

      const node = flowCore.getNodeById(metadata.nodeId);
      if (!node) continue;

      const port = node.measuredPorts?.find((port: Port) => port.id === metadata.portId);
      const currentSize = port?.size;
      const currentPosition = port?.position;

      if (
        currentSize &&
        !this.isSizeChanged(currentSize, size) &&
        currentPosition &&
        !this.isPositionChanged(currentPosition, position)
      ) {
        continue;
      }

      if (!updatesByNode.has(metadata.nodeId)) {
        updatesByNode.set(metadata.nodeId, []);
      }

      updatesByNode.get(metadata.nodeId)!.push({
        id: metadata.portId,
        size,
        position,
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

      const portsData = this.updatePortsService.getNodePortsData(metadata.nodeId);
      flowCore.updater.applyPortsSizesAndPositions(metadata.nodeId, portsData);
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
        size: { width: number; height: number };
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
  private getBorderBoxSize(entry: ResizeObserverEntry): { width: number; height: number } | null {
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
  private isSizeChanged(currentSize: { width: number; height: number }, newSize: { width: number; height: number }) {
    return Math.abs(currentSize.width - newSize.width) > 1 || Math.abs(currentSize.height - newSize.height) > 1;
  }

  /**
   * Check if the position has changed by more than 1px
   * @param currentPosition Current position
   * @param newPosition New position
   * @returns True if the position has changed by more than 1px, false otherwise
   */
  private isPositionChanged(currentPosition: { x: number; y: number }, newPosition: { x: number; y: number }) {
    return Math.abs(currentPosition.x - newPosition.x) > 1 || Math.abs(currentPosition.y - newPosition.y) > 1;
  }
}
