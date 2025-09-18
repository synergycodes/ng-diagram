import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EdgeLabel } from '../types';
import { LabelBatchProcessor, type LabelUpdate } from './label-batch-processor';

describe('LabelBatchProcessor', () => {
  let labelBatchProcessor: LabelBatchProcessor;
  let flushCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    labelBatchProcessor = new LabelBatchProcessor();
    flushCallback = vi.fn();
  });

  describe('processAdd', () => {
    it('should batch multiple labels for the same edge', async () => {
      const edgeId = 'edge-1';
      const label1: EdgeLabel = { id: 'label-1', positionOnEdge: 0.25 };
      const label2: EdgeLabel = { id: 'label-2', positionOnEdge: 0.5 };
      const label3: EdgeLabel = { id: 'label-3', positionOnEdge: 0.75 };

      // Add multiple labels in the same tick
      labelBatchProcessor.processAdd(edgeId, label1, flushCallback);
      labelBatchProcessor.processAdd(edgeId, label2, flushCallback);
      labelBatchProcessor.processAdd(edgeId, label3, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback once with all three labels
      expect(flushCallback).toHaveBeenCalledTimes(1);
      expect(flushCallback).toHaveBeenCalledWith(edgeId, [label1, label2, label3]);
    });

    it('should handle labels for different edges separately', async () => {
      const edge1Id = 'edge-1';
      const edge2Id = 'edge-2';
      const label1: EdgeLabel = { id: 'label-1', positionOnEdge: 0.25 };
      const label2: EdgeLabel = { id: 'label-2', positionOnEdge: 0.75 };

      // Add labels for different edges
      labelBatchProcessor.processAdd(edge1Id, label1, flushCallback);
      labelBatchProcessor.processAdd(edge2Id, label2, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each edge
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(edge1Id, [label1]);
      expect(flushCallback).toHaveBeenCalledWith(edge2Id, [label2]);
    });

    it('should handle multiple batches for the same edge across different ticks', async () => {
      const edgeId = 'edge-1';
      const label1: EdgeLabel = { id: 'label-1', positionOnEdge: 0.3 };
      const label2: EdgeLabel = { id: 'label-2', positionOnEdge: 0.7 };

      // Add first label
      labelBatchProcessor.processAdd(edgeId, label1, flushCallback);

      // Wait for first batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Add second label in a new tick
      labelBatchProcessor.processAdd(edgeId, label2, flushCallback);

      // Wait for second batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each batch
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(edgeId, [label1]);
      expect(flushCallback).toHaveBeenCalledWith(edgeId, [label2]);
    });
  });

  describe('processUpdate', () => {
    it('should batch multiple label updates for the same edge', async () => {
      const edgeId = 'edge-1';
      const update1: LabelUpdate = {
        labelId: 'label-1',
        labelChanges: { size: { width: 100, height: 50 }, position: { x: 10, y: 20 } },
      };
      const update2: LabelUpdate = {
        labelId: 'label-2',
        labelChanges: { position: { x: 20, y: 30 } },
      };
      const update3: LabelUpdate = {
        labelId: 'label-3',
        labelChanges: { size: { width: 200, height: 100 } },
      };

      // Add multiple label updates in the same tick
      labelBatchProcessor.processUpdate(edgeId, update1, flushCallback);
      labelBatchProcessor.processUpdate(edgeId, update2, flushCallback);
      labelBatchProcessor.processUpdate(edgeId, update3, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback once with all three updates
      expect(flushCallback).toHaveBeenCalledTimes(1);
      expect(flushCallback).toHaveBeenCalledWith(edgeId, [update1, update2, update3]);
    });

    it('should handle label updates for different edges separately', async () => {
      const edge1Id = 'edge-1';
      const edge2Id = 'edge-2';
      const update1: LabelUpdate = {
        labelId: 'label-1',
        labelChanges: { size: { width: 100, height: 50 } },
      };
      const update2: LabelUpdate = {
        labelId: 'label-2',
        labelChanges: { position: { x: 30, y: 40 } },
      };

      // Add label updates for different edges
      labelBatchProcessor.processUpdate(edge1Id, update1, flushCallback);
      labelBatchProcessor.processUpdate(edge2Id, update2, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each edge
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(edge1Id, [update1]);
      expect(flushCallback).toHaveBeenCalledWith(edge2Id, [update2]);
    });

    it('should handle multiple update batches for the same edge across different ticks', async () => {
      const edgeId = 'edge-1';
      const update1: LabelUpdate = {
        labelId: 'label-1',
        labelChanges: { size: { width: 100, height: 50 } },
      };
      const update2: LabelUpdate = {
        labelId: 'label-2',
        labelChanges: { position: { x: 30, y: 40 } },
      };

      // Add first label update
      labelBatchProcessor.processUpdate(edgeId, update1, flushCallback);

      // Wait for first batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Add second label update in a new tick
      labelBatchProcessor.processUpdate(edgeId, update2, flushCallback);

      // Wait for second batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each batch
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(edgeId, [update1]);
      expect(flushCallback).toHaveBeenCalledWith(edgeId, [update2]);
    });

    it('should handle updates to the same label in a batch', async () => {
      const edgeId = 'edge-1';
      const update1: LabelUpdate = {
        labelId: 'label-1',
        labelChanges: { size: { width: 100, height: 50 } },
      };
      const update2: LabelUpdate = {
        labelId: 'label-1',
        labelChanges: { position: { x: 30, y: 40 } },
      };

      // Add multiple updates to the same label
      labelBatchProcessor.processUpdate(edgeId, update1, flushCallback);
      labelBatchProcessor.processUpdate(edgeId, update2, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback once with both updates
      expect(flushCallback).toHaveBeenCalledTimes(1);
      expect(flushCallback).toHaveBeenCalledWith(edgeId, [update1, update2]);
    });
  });

  describe('processAdd and processUpdate together', () => {
    it('should handle additions and updates independently', async () => {
      const edgeId = 'edge-1';
      const label: EdgeLabel = { id: 'label-1', positionOnEdge: 0.5 };
      const update: LabelUpdate = {
        labelId: 'label-2',
        labelChanges: { size: { width: 100, height: 50 } },
      };
      const addCallback = vi.fn();
      const updateCallback = vi.fn();

      // Add and update in the same tick
      labelBatchProcessor.processAdd(edgeId, label, addCallback);
      labelBatchProcessor.processUpdate(edgeId, update, updateCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called each callback once
      expect(addCallback).toHaveBeenCalledTimes(1);
      expect(addCallback).toHaveBeenCalledWith(edgeId, [label]);
      expect(updateCallback).toHaveBeenCalledTimes(1);
      expect(updateCallback).toHaveBeenCalledWith(edgeId, [update]);
    });

    it('should batch additions and updates separately even for same edge', async () => {
      const edgeId = 'edge-1';
      const label1: EdgeLabel = { id: 'label-1', positionOnEdge: 0.25 };
      const label2: EdgeLabel = { id: 'label-2', positionOnEdge: 0.75 };
      const update1: LabelUpdate = {
        labelId: 'label-1',
        labelChanges: { size: { width: 100, height: 50 } },
      };
      const update2: LabelUpdate = {
        labelId: 'label-2',
        labelChanges: { position: { x: 30, y: 40 } },
      };
      const addCallback = vi.fn();
      const updateCallback = vi.fn();

      // Mix additions and updates in the same tick
      labelBatchProcessor.processAdd(edgeId, label1, addCallback);
      labelBatchProcessor.processUpdate(edgeId, update1, updateCallback);
      labelBatchProcessor.processAdd(edgeId, label2, addCallback);
      labelBatchProcessor.processUpdate(edgeId, update2, updateCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should batch additions and updates separately
      expect(addCallback).toHaveBeenCalledTimes(1);
      expect(addCallback).toHaveBeenCalledWith(edgeId, [label1, label2]);
      expect(updateCallback).toHaveBeenCalledTimes(1);
      expect(updateCallback).toHaveBeenCalledWith(edgeId, [update1, update2]);
    });

    it('should handle mixed operations for multiple edges', async () => {
      const edge1Id = 'edge-1';
      const edge2Id = 'edge-2';
      const label1: EdgeLabel = { id: 'label-1', positionOnEdge: 0.4 };
      const label2: EdgeLabel = { id: 'label-2', positionOnEdge: 0.6 };
      const update1: LabelUpdate = {
        labelId: 'label-3',
        labelChanges: { size: { width: 80, height: 40 } },
      };
      const update2: LabelUpdate = {
        labelId: 'label-4',
        labelChanges: { position: { x: 100, y: 50 } },
      };
      const addCallback = vi.fn();
      const updateCallback = vi.fn();

      // Mix operations across edges
      labelBatchProcessor.processAdd(edge1Id, label1, addCallback);
      labelBatchProcessor.processUpdate(edge2Id, update2, updateCallback);
      labelBatchProcessor.processAdd(edge2Id, label2, addCallback);
      labelBatchProcessor.processUpdate(edge1Id, update1, updateCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called callbacks for each operation type and edge
      expect(addCallback).toHaveBeenCalledTimes(2);
      expect(addCallback).toHaveBeenCalledWith(edge1Id, [label1]);
      expect(addCallback).toHaveBeenCalledWith(edge2Id, [label2]);
      expect(updateCallback).toHaveBeenCalledTimes(2);
      expect(updateCallback).toHaveBeenCalledWith(edge1Id, [update1]);
      expect(updateCallback).toHaveBeenCalledWith(edge2Id, [update2]);
    });
  });
});
