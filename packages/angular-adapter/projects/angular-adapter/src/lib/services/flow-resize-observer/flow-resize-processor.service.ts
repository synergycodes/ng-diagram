import { Injectable, inject } from '@angular/core';
import { FlowCoreProviderService } from '../flow-core-provider/flow-core-provider.service';
import { UpdatePortsService } from '../update-ports/update-ports.service';
import { BatchResizeObserverService, type ObservedElementMetadata } from './batched-resize-observer.service';

interface ProcessedEntry {
  entry: ResizeObserverEntry;
  metadata: ObservedElementMetadata;
}

@Injectable({
  providedIn: 'root',
})
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

    const startTime = performance.now();

    // Separate ports and edge labels
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

    const elapsed = performance.now() - startTime;

    console.log(`[ResizeBatch] Processed ${entries.length} elements in ${elapsed.toFixed(2)}ms`);
  }

  /**
   * Process all port resize events
   */
  private processPortBatch(entries: ProcessedEntry[]): void {
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

      if (!updatesByNode.has(metadata.nodeId)) {
        updatesByNode.set(metadata.nodeId, []);
      }

      updatesByNode.get(metadata.nodeId)!.push({
        id: metadata.portId,
        size,
        position,
      });
    }

    const flowCore = this.flowCoreProvider.provide();

    updatesByNode.forEach((ports, nodeId) => {
      flowCore.internalUpdater.applyPortsSizesAndPositions(nodeId, ports);
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

      flowCore.internalUpdater.applyNodeSize(metadata.nodeId, { size });

      const portsData = this.updatePortsService.getNodePortsData(metadata.nodeId);
      flowCore.internalUpdater.applyPortsSizesAndPositions(metadata.nodeId, portsData);
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
        flowCore.internalUpdater.applyEdgeLabelSize(edgeId, labelId, size);
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
}
