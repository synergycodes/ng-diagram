import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Node, Port } from '../types';
import { PortBatchProcessor, PortUpdate, toPortUpdates } from './port-batch-processor';

describe('PortBatchProcessor', () => {
  let processor: PortBatchProcessor;

  beforeEach(() => {
    processor = new PortBatchProcessor(() => undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should accept Port items for add operations', async () => {
    const onFlush = vi.fn();
    const port: Port = { id: 'port-1', nodeId: 'node1', type: 'source', side: 'left' };

    processor.processAdd('node1', port, onFlush);
    await vi.runAllTimersAsync();

    expect(onFlush).toHaveBeenCalledTimes(1);
    const additions = onFlush.mock.calls[0][0] as Map<string, Port[]>;
    expect(additions.get('node1')).toEqual([port]);
  });

  it('should accept PortUpdate items for update operations', async () => {
    const onFlush = vi.fn();
    const update: PortUpdate = { portId: 'port-1', portChanges: { side: 'right' } };

    processor.processUpdate('node1', update, onFlush);
    await vi.runAllTimersAsync();

    expect(onFlush).toHaveBeenCalledTimes(1);
    const updates = onFlush.mock.calls[0][0] as Map<string, PortUpdate[]>;
    expect(updates.get('node1')).toEqual([update]);
  });

  it('should accept port IDs for delete operations', async () => {
    const onFlush = vi.fn();

    processor.processDelete('node1', 'port-1', onFlush);
    await vi.runAllTimersAsync();

    expect(onFlush).toHaveBeenCalledTimes(1);
    const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
    expect(deletions.get('node1')).toEqual(['port-1']);
  });

  describe('getMeasuredIds', () => {
    it('should filter out adds for ports with valid size and position', async () => {
      const node = {
        measuredPorts: [{ id: 'port-1', size: { width: 10, height: 10 }, position: { x: 5, y: 5 } }],
      } as unknown as Node;
      const proc = new PortBatchProcessor(() => node);
      vi.useFakeTimers();

      const onFlush = vi.fn();
      proc.processAdd('node1', { id: 'port-1', nodeId: 'node1', type: 'source', side: 'left' }, onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).not.toHaveBeenCalled();
    });

    it('should keep adds for ports missing size', async () => {
      const node = {
        measuredPorts: [{ id: 'port-1', size: undefined, position: { x: 5, y: 5 } }],
      } as unknown as Node;
      const proc = new PortBatchProcessor(() => node);
      vi.useFakeTimers();

      const onFlush = vi.fn();
      proc.processAdd('node1', { id: 'port-1', nodeId: 'node1', type: 'source', side: 'left' }, onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);
    });

    it('should keep adds for ports missing position', async () => {
      const node = {
        measuredPorts: [{ id: 'port-1', size: { width: 10, height: 10 }, position: undefined }],
      } as unknown as Node;
      const proc = new PortBatchProcessor(() => node);
      vi.useFakeTimers();

      const onFlush = vi.fn();
      proc.processAdd('node1', { id: 'port-1', nodeId: 'node1', type: 'source', side: 'left' }, onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);
    });

    it('should return empty set when node is not found', async () => {
      const proc = new PortBatchProcessor(() => null);
      vi.useFakeTimers();

      const onFlush = vi.fn();
      proc.processAdd('node1', { id: 'port-1', nodeId: 'node1', type: 'source', side: 'left' }, onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);
    });
  });
});

describe('toPortUpdates', () => {
  it('should convert port data to PortUpdate array', () => {
    const ports = [
      { id: 'p1', size: { width: 10, height: 10 }, position: { x: 0, y: 0 } },
      { id: 'p2', size: { width: 20, height: 20 }, position: { x: 5, y: 5 } },
    ];

    const result = toPortUpdates(ports);

    expect(result).toEqual([
      { portId: 'p1', portChanges: { size: { width: 10, height: 10 }, position: { x: 0, y: 0 } } },
      { portId: 'p2', portChanges: { size: { width: 20, height: 20 }, position: { x: 5, y: 5 } } },
    ]);
  });
});
