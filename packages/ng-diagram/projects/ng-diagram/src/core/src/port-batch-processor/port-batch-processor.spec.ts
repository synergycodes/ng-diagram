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
});
