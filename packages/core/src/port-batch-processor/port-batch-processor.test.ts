import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Port } from '../types';
import { PortBatchProcessor, type PortUpdate } from './port-batch-processor';

describe('PortBatchProcessor', () => {
  let portBatchProcessor: PortBatchProcessor;
  let flushCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    portBatchProcessor = new PortBatchProcessor();
    flushCallback = vi.fn();
  });

  describe('processAdd', () => {
    it('should batch multiple ports for the same node', async () => {
      const nodeId = 'node-1';
      const port1: Port = { id: 'port-1', type: 'source', nodeId, side: 'left' };
      const port2: Port = { id: 'port-2', type: 'target', nodeId, side: 'right' };
      const port3: Port = { id: 'port-3', type: 'both', nodeId, side: 'top' };

      // Add multiple ports in the same tick
      portBatchProcessor.processAdd(nodeId, port1, flushCallback);
      portBatchProcessor.processAdd(nodeId, port2, flushCallback);
      portBatchProcessor.processAdd(nodeId, port3, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback once with all three ports
      expect(flushCallback).toHaveBeenCalledTimes(1);
      expect(flushCallback).toHaveBeenCalledWith(nodeId, [port1, port2, port3]);
    });

    it('should handle ports for different nodes separately', async () => {
      const node1Id = 'node-1';
      const node2Id = 'node-2';
      const port1: Port = { id: 'port-1', type: 'source', nodeId: node1Id, side: 'left' };
      const port2: Port = { id: 'port-2', type: 'target', nodeId: node2Id, side: 'right' };

      // Add ports for different nodes
      portBatchProcessor.processAdd(node1Id, port1, flushCallback);
      portBatchProcessor.processAdd(node2Id, port2, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each node
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(node1Id, [port1]);
      expect(flushCallback).toHaveBeenCalledWith(node2Id, [port2]);
    });

    it('should handle multiple batches for the same node across different ticks', async () => {
      const nodeId = 'node-1';
      const port1: Port = { id: 'port-1', type: 'source', nodeId, side: 'left' };
      const port2: Port = { id: 'port-2', type: 'target', nodeId, side: 'right' };

      // Add first port
      portBatchProcessor.processAdd(nodeId, port1, flushCallback);

      // Wait for first batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Add second port in a new tick
      portBatchProcessor.processAdd(nodeId, port2, flushCallback);

      // Wait for second batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each batch
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(nodeId, [port1]);
      expect(flushCallback).toHaveBeenCalledWith(nodeId, [port2]);
    });
  });

  describe('processUpdate', () => {
    it('should batch multiple port updates for the same node', async () => {
      const nodeId = 'node-1';
      const update1: PortUpdate = {
        portId: 'port-1',
        portChanges: { size: { width: 100, height: 50 }, position: { x: 10, y: 20 } },
      };
      const update2: PortUpdate = {
        portId: 'port-2',
        portChanges: { position: { x: 30, y: 40 } },
      };
      const update3: PortUpdate = {
        portId: 'port-3',
        portChanges: { size: { width: 200, height: 100 } },
      };

      // Add multiple port updates in the same tick
      portBatchProcessor.processUpdate(nodeId, update1, flushCallback);
      portBatchProcessor.processUpdate(nodeId, update2, flushCallback);
      portBatchProcessor.processUpdate(nodeId, update3, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback once with all three updates
      expect(flushCallback).toHaveBeenCalledTimes(1);
      expect(flushCallback).toHaveBeenCalledWith(nodeId, [update1, update2, update3]);
    });

    it('should handle port updates for different nodes separately', async () => {
      const node1Id = 'node-1';
      const node2Id = 'node-2';
      const update1: PortUpdate = {
        portId: 'port-1',
        portChanges: { size: { width: 100, height: 50 } },
      };
      const update2: PortUpdate = {
        portId: 'port-2',
        portChanges: { position: { x: 30, y: 40 } },
      };

      // Add port updates for different nodes
      portBatchProcessor.processUpdate(node1Id, update1, flushCallback);
      portBatchProcessor.processUpdate(node2Id, update2, flushCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each node
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(node1Id, [update1]);
      expect(flushCallback).toHaveBeenCalledWith(node2Id, [update2]);
    });

    it('should handle multiple update batches for the same node across different ticks', async () => {
      const nodeId = 'node-1';
      const update1: PortUpdate = {
        portId: 'port-1',
        portChanges: { size: { width: 100, height: 50 } },
      };
      const update2: PortUpdate = {
        portId: 'port-2',
        portChanges: { position: { x: 30, y: 40 } },
      };

      // Add first port update
      portBatchProcessor.processUpdate(nodeId, update1, flushCallback);

      // Wait for first batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Add second port update in a new tick
      portBatchProcessor.processUpdate(nodeId, update2, flushCallback);

      // Wait for second batch to flush
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called flushCallback twice, once for each batch
      expect(flushCallback).toHaveBeenCalledTimes(2);
      expect(flushCallback).toHaveBeenCalledWith(nodeId, [update1]);
      expect(flushCallback).toHaveBeenCalledWith(nodeId, [update2]);
    });
  });

  describe('processAdd and processUpdate together', () => {
    it('should handle additions and updates independently', async () => {
      const nodeId = 'node-1';
      const port: Port = { id: 'port-1', type: 'source', nodeId, side: 'left' };
      const update: PortUpdate = {
        portId: 'port-2',
        portChanges: { size: { width: 100, height: 50 } },
      };
      const addCallback = vi.fn();
      const updateCallback = vi.fn();

      // Add and update in the same tick
      portBatchProcessor.processAdd(nodeId, port, addCallback);
      portBatchProcessor.processUpdate(nodeId, update, updateCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should have called each callback once
      expect(addCallback).toHaveBeenCalledTimes(1);
      expect(addCallback).toHaveBeenCalledWith(nodeId, [port]);
      expect(updateCallback).toHaveBeenCalledTimes(1);
      expect(updateCallback).toHaveBeenCalledWith(nodeId, [update]);
    });

    it('should batch additions and updates separately even for same node', async () => {
      const nodeId = 'node-1';
      const port1: Port = { id: 'port-1', type: 'source', nodeId, side: 'left' };
      const port2: Port = { id: 'port-2', type: 'target', nodeId, side: 'right' };
      const update1: PortUpdate = {
        portId: 'port-1',
        portChanges: { size: { width: 100, height: 50 } },
      };
      const update2: PortUpdate = {
        portId: 'port-2',
        portChanges: { position: { x: 30, y: 40 } },
      };
      const addCallback = vi.fn();
      const updateCallback = vi.fn();

      // Mix additions and updates in the same tick
      portBatchProcessor.processAdd(nodeId, port1, addCallback);
      portBatchProcessor.processUpdate(nodeId, update1, updateCallback);
      portBatchProcessor.processAdd(nodeId, port2, addCallback);
      portBatchProcessor.processUpdate(nodeId, update2, updateCallback);

      // Wait for microtask to execute
      await new Promise<void>((resolve) => queueMicrotask(resolve));

      // Should batch additions and updates separately
      expect(addCallback).toHaveBeenCalledTimes(1);
      expect(addCallback).toHaveBeenCalledWith(nodeId, [port1, port2]);
      expect(updateCallback).toHaveBeenCalledTimes(1);
      expect(updateCallback).toHaveBeenCalledWith(nodeId, [update1, update2]);
    });
  });
});
