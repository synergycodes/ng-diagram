import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EdgeLabel } from '../types';
import { LabelBatchProcessor, type LabelUpdate } from './label-batch-processor';

describe('LabelBatchProcessor', () => {
  let processor: LabelBatchProcessor;

  beforeEach(() => {
    processor = new LabelBatchProcessor(() => undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should accept EdgeLabel items for add operations', async () => {
    const onFlush = vi.fn();
    const label: EdgeLabel = { id: 'label-1', positionOnEdge: 0.5 };

    processor.processAdd('edge1', label, onFlush);
    await vi.runAllTimersAsync();

    expect(onFlush).toHaveBeenCalledTimes(1);
    const additions = onFlush.mock.calls[0][0] as Map<string, EdgeLabel[]>;
    expect(additions.get('edge1')).toEqual([label]);
  });

  it('should accept LabelUpdate items for update operations', async () => {
    const onFlush = vi.fn();
    const update: LabelUpdate = { labelId: 'label-1', labelChanges: { positionOnEdge: 0.75 } };

    processor.processUpdate('edge1', update, onFlush);
    await vi.runAllTimersAsync();

    expect(onFlush).toHaveBeenCalledTimes(1);
    const updates = onFlush.mock.calls[0][0] as Map<string, LabelUpdate[]>;
    expect(updates.get('edge1')).toEqual([update]);
  });

  it('should accept label IDs for delete operations', async () => {
    const onFlush = vi.fn();

    processor.processDelete('edge1', 'label-1', onFlush);
    await vi.runAllTimersAsync();

    expect(onFlush).toHaveBeenCalledTimes(1);
    const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
    expect(deletions.get('edge1')).toEqual(['label-1']);
  });
});
