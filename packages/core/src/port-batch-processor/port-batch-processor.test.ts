import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Port } from '../types';
import { PortBatchProcessor } from './port-batch-processor';

describe('PortBatchProcessor', () => {
  let portBatchProcessor: PortBatchProcessor;
  let flushCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    portBatchProcessor = new PortBatchProcessor();
    flushCallback = vi.fn();
  });

  it('should batch multiple ports for the same node', async () => {
    const nodeId = 'node-1';
    const port1: Port = { id: 'port-1', type: 'source', nodeId, side: 'left' };
    const port2: Port = { id: 'port-2', type: 'target', nodeId, side: 'right' };
    const port3: Port = { id: 'port-3', type: 'both', nodeId, side: 'top' };

    // Add multiple ports in the same tick
    portBatchProcessor.process(nodeId, port1, flushCallback);
    portBatchProcessor.process(nodeId, port2, flushCallback);
    portBatchProcessor.process(nodeId, port3, flushCallback);

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
    portBatchProcessor.process(node1Id, port1, flushCallback);
    portBatchProcessor.process(node2Id, port2, flushCallback);

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
    portBatchProcessor.process(nodeId, port1, flushCallback);

    // Wait for first batch to flush
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    // Add second port in a new tick
    portBatchProcessor.process(nodeId, port2, flushCallback);

    // Wait for second batch to flush
    await new Promise<void>((resolve) => queueMicrotask(resolve));

    // Should have called flushCallback twice, once for each batch
    expect(flushCallback).toHaveBeenCalledTimes(2);
    expect(flushCallback).toHaveBeenCalledWith(nodeId, [port1]);
    expect(flushCallback).toHaveBeenCalledWith(nodeId, [port2]);
  });
});
