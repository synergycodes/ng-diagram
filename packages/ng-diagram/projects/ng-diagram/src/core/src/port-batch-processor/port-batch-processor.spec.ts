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

  describe('Standard Mode (per-node batching)', () => {
    describe('processAdd', () => {
      it('should batch multiple port additions for the same node in the same tick', async () => {
        const onFlush = vi.fn();

        processor.processAdd('node1', createPort('port1'), onFlush);
        processor.processAdd('node1', createPort('port2'), onFlush);
        processor.processAdd('node1', createPort('port3'), onFlush);

        expect(onFlush).not.toHaveBeenCalled();

        await vi.runAllTimersAsync();

        expect(onFlush).toHaveBeenCalledTimes(1);
        expect(onFlush).toHaveBeenCalledWith('node1', [createPort('port1'), createPort('port2'), createPort('port3')]);
      });

      it('should batch separately for different nodes', async () => {
        const onFlush = vi.fn();

        processor.processAdd('node1', createPort('port1'), onFlush);
        processor.processAdd('node2', createPort('port2'), onFlush);

        await vi.runAllTimersAsync();

        expect(onFlush).toHaveBeenCalledTimes(2);
        expect(onFlush).toHaveBeenCalledWith('node1', [createPort('port1')]);
        expect(onFlush).toHaveBeenCalledWith('node2', [createPort('port2')]);
      });

      it('should handle subsequent batches after flush', async () => {
        const onFlush = vi.fn();

        processor.processAdd('node1', createPort('port1'), onFlush);
        await vi.runAllTimersAsync();

        processor.processAdd('node1', createPort('port2'), onFlush);
        await vi.runAllTimersAsync();

        expect(onFlush).toHaveBeenCalledTimes(2);
        expect(onFlush).toHaveBeenNthCalledWith(1, 'node1', [createPort('port1')]);
        expect(onFlush).toHaveBeenNthCalledWith(2, 'node1', [createPort('port2')]);
      });
    });

    describe('processUpdate', () => {
      it('should batch multiple port updates for the same node in the same tick', async () => {
        const onFlush = vi.fn();

        processor.processUpdate('node1', createPortUpdate('port1'), onFlush);
        processor.processUpdate('node1', createPortUpdate('port2'), onFlush);

        await vi.runAllTimersAsync();

        expect(onFlush).toHaveBeenCalledTimes(1);
        expect(onFlush).toHaveBeenCalledWith('node1', [createPortUpdate('port1'), createPortUpdate('port2')]);
      });

      it('should batch separately for different nodes', async () => {
        const onFlush = vi.fn();

        processor.processUpdate('node1', createPortUpdate('port1'), onFlush);
        processor.processUpdate('node2', createPortUpdate('port2'), onFlush);

        await vi.runAllTimersAsync();

        expect(onFlush).toHaveBeenCalledTimes(2);
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
        expect(onFlush).toHaveBeenCalledWith('node1', ['port1', 'port2', 'port3']);
      });

      it('should batch separately for different nodes', async () => {
        const onFlush = vi.fn();

        processor.processDelete('node1', 'port1', onFlush);
        processor.processDelete('node2', 'port2', onFlush);

        await vi.runAllTimersAsync();

        expect(onFlush).toHaveBeenCalledTimes(2);
        expect(onFlush).toHaveBeenCalledWith('node1', ['port1']);
        expect(onFlush).toHaveBeenCalledWith('node2', ['port2']);
      });

      it('should handle subsequent batches after flush', async () => {
        const onFlush = vi.fn();

        processor.processDelete('node1', 'port1', onFlush);
        await vi.runAllTimersAsync();

        processor.processDelete('node1', 'port2', onFlush);
        await vi.runAllTimersAsync();

        expect(onFlush).toHaveBeenCalledTimes(2);
        expect(onFlush).toHaveBeenNthCalledWith(1, 'node1', ['port1']);
        expect(onFlush).toHaveBeenNthCalledWith(2, 'node1', ['port2']);
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
        expect(onFlush).toHaveBeenCalledWith('node1', ['port-left', 'port-right']);
      });
    });
  });

  describe('Virtualization Mode (global batching)', () => {
    describe('processAddBatched', () => {
      it('should batch all additions across all nodes into single callback', async () => {
        const onBatchFlush = vi.fn();

        processor.processAddBatched('node1', createPort('port1'), onBatchFlush);
        processor.processAddBatched('node2', createPort('port2'), onBatchFlush);
        processor.processAddBatched('node1', createPort('port3'), onBatchFlush);

        await vi.runAllTimersAsync();

        expect(onBatchFlush).toHaveBeenCalledTimes(1);

        const additions = onBatchFlush.mock.calls[0][0] as Map<string, Port[]>;
        expect(additions.get('node1')).toEqual([createPort('port1'), createPort('port3')]);
        expect(additions.get('node2')).toEqual([createPort('port2')]);
      });
    });

    describe('processUpdateBatched', () => {
      it('should batch all updates across all nodes into single callback', async () => {
        const onBatchFlush = vi.fn();

        processor.processUpdateBatched('node1', createPortUpdate('port1'), onBatchFlush);
        processor.processUpdateBatched('node2', createPortUpdate('port2'), onBatchFlush);

        await vi.runAllTimersAsync();

        expect(onBatchFlush).toHaveBeenCalledTimes(1);

        const updates = onBatchFlush.mock.calls[0][0] as Map<string, PortUpdate[]>;
        expect(updates.get('node1')).toEqual([createPortUpdate('port1')]);
        expect(updates.get('node2')).toEqual([createPortUpdate('port2')]);
      });
    });

    describe('processDeleteBatched', () => {
      it('should batch all deletions across all nodes into single callback', async () => {
        const onBatchFlush = vi.fn();

        processor.processDeleteBatched('node1', 'port1', onBatchFlush);
        processor.processDeleteBatched('node2', 'port2', onBatchFlush);
        processor.processDeleteBatched('node1', 'port3', onBatchFlush);

        await vi.runAllTimersAsync();

        expect(onBatchFlush).toHaveBeenCalledTimes(1);

        const deletions = onBatchFlush.mock.calls[0][0] as Map<string, string[]>;
        expect(deletions.get('node1')).toEqual(['port1', 'port3']);
        expect(deletions.get('node2')).toEqual(['port2']);
      });

      it('should handle virtualization scenario where many nodes are destroyed simultaneously', async () => {
        const onBatchFlush = vi.fn();

        // Simulate many nodes being virtualized (scrolled out of view)
        for (let i = 0; i < 100; i++) {
          processor.processDeleteBatched(`node${i}`, `port${i}`, onBatchFlush);
        }

        await vi.runAllTimersAsync();

        // Should result in a single batched callback
        expect(onBatchFlush).toHaveBeenCalledTimes(1);

        const deletions = onBatchFlush.mock.calls[0][0] as Map<string, string[]>;
        expect(deletions.size).toBe(100);
      });
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
  });
});
