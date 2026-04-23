import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Port } from '../types';
import { PortBatchProcessor, PortUpdate } from './port-batch-processor';

describe('PortBatchProcessor', () => {
  let processor: PortBatchProcessor;

  beforeEach(() => {
    processor = new PortBatchProcessor();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createPort = (id: string, nodeId = 'node1'): Port => ({
    id,
    nodeId,
    type: 'source',
    side: 'left',
  });

  const createPortUpdate = (portId: string): PortUpdate => ({
    portId,
    portChanges: { side: 'right' },
  });

  describe('processAdd', () => {
    it('should batch multiple port additions for the same node in the same tick', async () => {
      const onFlush = vi.fn();

      processor.processAdd('node1', createPort('port1'), onFlush);
      processor.processAdd('node1', createPort('port2'), onFlush);
      processor.processAdd('node1', createPort('port3'), onFlush);

      expect(onFlush).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const additions = onFlush.mock.calls[0][0] as Map<string, Port[]>;
      expect(additions.get('node1')).toEqual([createPort('port1'), createPort('port2'), createPort('port3')]);
    });

    it('should batch separately for different nodes', async () => {
      const onFlush = vi.fn();

      processor.processAdd('node1', createPort('port1'), onFlush);
      processor.processAdd('node2', createPort('port2'), onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const additions = onFlush.mock.calls[0][0] as Map<string, Port[]>;
      expect(additions.get('node1')).toEqual([createPort('port1')]);
      expect(additions.get('node2')).toEqual([createPort('port2')]);
    });

    it('should handle subsequent batches after flush', async () => {
      const onFlush = vi.fn();

      processor.processAdd('node1', createPort('port1'), onFlush);
      await vi.runAllTimersAsync();

      processor.processAdd('node1', createPort('port2'), onFlush);
      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(2);

      const firstAdditions = onFlush.mock.calls[0][0] as Map<string, Port[]>;
      expect(firstAdditions.get('node1')).toEqual([createPort('port1')]);

      const secondAdditions = onFlush.mock.calls[1][0] as Map<string, Port[]>;
      expect(secondAdditions.get('node1')).toEqual([createPort('port2')]);
    });

    it('should batch all additions across all nodes into single callback', async () => {
      const onFlush = vi.fn();

      processor.processAdd('node1', createPort('port1'), onFlush);
      processor.processAdd('node2', createPort('port2'), onFlush);
      processor.processAdd('node1', createPort('port3'), onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const additions = onFlush.mock.calls[0][0] as Map<string, Port[]>;
      expect(additions.get('node1')).toEqual([createPort('port1'), createPort('port3')]);
      expect(additions.get('node2')).toEqual([createPort('port2')]);
    });
  });

  describe('processUpdate', () => {
    it('should batch multiple port updates for the same node in the same tick', async () => {
      const onFlush = vi.fn();

      processor.processUpdate('node1', createPortUpdate('port1'), onFlush);
      processor.processUpdate('node1', createPortUpdate('port2'), onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const updates = onFlush.mock.calls[0][0] as Map<string, PortUpdate[]>;
      expect(updates.get('node1')).toEqual([createPortUpdate('port1'), createPortUpdate('port2')]);
    });

    it('should batch separately for different nodes', async () => {
      const onFlush = vi.fn();

      processor.processUpdate('node1', createPortUpdate('port1'), onFlush);
      processor.processUpdate('node2', createPortUpdate('port2'), onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const updates = onFlush.mock.calls[0][0] as Map<string, PortUpdate[]>;
      expect(updates.get('node1')).toEqual([createPortUpdate('port1')]);
      expect(updates.get('node2')).toEqual([createPortUpdate('port2')]);
    });

    it('should handle subsequent batches after flush', async () => {
      const onFlush = vi.fn();

      processor.processUpdate('node1', createPortUpdate('port1'), onFlush);
      await vi.runAllTimersAsync();

      processor.processUpdate('node1', createPortUpdate('port2'), onFlush);
      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(2);

      const firstUpdates = onFlush.mock.calls[0][0] as Map<string, PortUpdate[]>;
      expect(firstUpdates.get('node1')).toEqual([createPortUpdate('port1')]);

      const secondUpdates = onFlush.mock.calls[1][0] as Map<string, PortUpdate[]>;
      expect(secondUpdates.get('node1')).toEqual([createPortUpdate('port2')]);
    });
  });

  describe('processDelete', () => {
    it('should batch multiple port deletions for the same node in the same tick', async () => {
      const onFlush = vi.fn();

      processor.processDelete('node1', 'port1', onFlush);
      processor.processDelete('node1', 'port2', onFlush);
      processor.processDelete('node1', 'port3', onFlush);

      expect(onFlush).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.get('node1')).toEqual(['port1', 'port2', 'port3']);
    });

    it('should batch separately for different nodes', async () => {
      const onFlush = vi.fn();

      processor.processDelete('node1', 'port1', onFlush);
      processor.processDelete('node2', 'port2', onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.get('node1')).toEqual(['port1']);
      expect(deletions.get('node2')).toEqual(['port2']);
    });

    it('should handle subsequent batches after flush', async () => {
      const onFlush = vi.fn();

      processor.processDelete('node1', 'port1', onFlush);
      await vi.runAllTimersAsync();

      processor.processDelete('node1', 'port2', onFlush);
      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(2);

      const firstDeletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(firstDeletions.get('node1')).toEqual(['port1']);

      const secondDeletions = onFlush.mock.calls[1][0] as Map<string, string[]>;
      expect(secondDeletions.get('node1')).toEqual(['port2']);
    });

    it('should fix race condition when multiple ports are deleted simultaneously', async () => {
      // This is the core bug we fixed: when @if toggles off, multiple ports
      // call ngOnDestroy in the same tick. Without batching, each emits
      // a separate command causing race conditions.
      const onFlush = vi.fn();

      // Simulate two ports being destroyed in the same tick
      processor.processDelete('node1', 'port-left', onFlush);
      processor.processDelete('node1', 'port-right', onFlush);

      await vi.runAllTimersAsync();

      // Should result in a single batched deletion
      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.get('node1')).toEqual(['port-left', 'port-right']);
    });

    it('should batch all deletions across all nodes into single callback', async () => {
      const onFlush = vi.fn();

      processor.processDelete('node1', 'port1', onFlush);
      processor.processDelete('node2', 'port2', onFlush);
      processor.processDelete('node1', 'port3', onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.get('node1')).toEqual(['port1', 'port3']);
      expect(deletions.get('node2')).toEqual(['port2']);
    });

    it('should handle virtualization scenario where many nodes are destroyed simultaneously', async () => {
      const onFlush = vi.fn();

      // Simulate many nodes being virtualized (scrolled out of view)
      for (let i = 0; i < 100; i++) {
        processor.processDelete(`node${i}`, `port${i}`, onFlush);
      }

      await vi.runAllTimersAsync();

      // Should result in a single batched callback
      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.size).toBe(100);
    });
  });

  describe('Mixed operations', () => {
    it('should keep add, update, and delete operations separate', async () => {
      const onAddFlush = vi.fn();
      const onUpdateFlush = vi.fn();
      const onDeleteFlush = vi.fn();

      processor.processAdd('node1', createPort('port1'), onAddFlush);
      processor.processUpdate('node1', createPortUpdate('port2'), onUpdateFlush);
      processor.processDelete('node1', 'port3', onDeleteFlush);

      await vi.runAllTimersAsync();

      expect(onAddFlush).toHaveBeenCalledTimes(1);
      expect(onUpdateFlush).toHaveBeenCalledTimes(1);
      expect(onDeleteFlush).toHaveBeenCalledTimes(1);
    });

    it('should flush deletes before updates before adds', async () => {
      const callOrder: string[] = [];

      processor.processAdd('node1', createPort('port1'), () => {
        callOrder.push('add');
      });
      processor.processUpdate('node1', createPortUpdate('port2'), () => {
        callOrder.push('update');
      });
      processor.processDelete('node1', 'port3', () => {
        callOrder.push('delete');
      });

      await vi.runAllTimersAsync();

      expect(callOrder).toEqual(['delete', 'update', 'add']);
    });

    it('should await each callback before starting the next', async () => {
      const callOrder: string[] = [];

      processor.processDelete('node1', 'port1', async () => {
        callOrder.push('delete-start');
        await Promise.resolve();
        callOrder.push('delete-end');
      });
      processor.processAdd('node1', createPort('port2'), async () => {
        callOrder.push('add-start');
        await Promise.resolve();
        callOrder.push('add-end');
      });

      await vi.runAllTimersAsync();

      expect(callOrder).toEqual(['delete-start', 'delete-end', 'add-start', 'add-end']);
    });
  });
});
