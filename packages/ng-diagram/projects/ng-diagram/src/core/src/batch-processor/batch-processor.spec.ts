import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchProcessor } from './batch-processor';

interface TestItem {
  id: string;
  value: string;
}

interface TestUpdate {
  itemId: string;
  changes: Partial<TestItem>;
}

describe('BatchProcessor', () => {
  let processor: BatchProcessor<TestItem, TestUpdate>;

  beforeEach(() => {
    processor = new BatchProcessor();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createItem = (id: string): TestItem => ({ id, value: `value-${id}` });
  const createUpdate = (itemId: string): TestUpdate => ({ itemId, changes: { value: 'updated' } });

  describe('processAdd', () => {
    it('should batch multiple additions for the same key in the same tick', async () => {
      const onFlush = vi.fn();

      processor.processAdd('key1', createItem('a'), onFlush);
      processor.processAdd('key1', createItem('b'), onFlush);
      processor.processAdd('key1', createItem('c'), onFlush);

      expect(onFlush).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const additions = onFlush.mock.calls[0][0] as Map<string, TestItem[]>;
      expect(additions.get('key1')).toEqual([createItem('a'), createItem('b'), createItem('c')]);
    });

    it('should group different keys into a single callback', async () => {
      const onFlush = vi.fn();

      processor.processAdd('key1', createItem('a'), onFlush);
      processor.processAdd('key2', createItem('b'), onFlush);
      processor.processAdd('key1', createItem('c'), onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const additions = onFlush.mock.calls[0][0] as Map<string, TestItem[]>;
      expect(additions.get('key1')).toEqual([createItem('a'), createItem('c')]);
      expect(additions.get('key2')).toEqual([createItem('b')]);
    });

    it('should handle subsequent batches across different ticks', async () => {
      const onFlush = vi.fn();

      processor.processAdd('key1', createItem('a'), onFlush);
      await vi.runAllTimersAsync();

      processor.processAdd('key1', createItem('b'), onFlush);
      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(2);

      const first = onFlush.mock.calls[0][0] as Map<string, TestItem[]>;
      expect(first.get('key1')).toEqual([createItem('a')]);

      const second = onFlush.mock.calls[1][0] as Map<string, TestItem[]>;
      expect(second.get('key1')).toEqual([createItem('b')]);
    });
  });

  describe('processUpdate', () => {
    it('should batch multiple updates for the same key in the same tick', async () => {
      const onFlush = vi.fn();

      processor.processUpdate('key1', createUpdate('a'), onFlush);
      processor.processUpdate('key1', createUpdate('b'), onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const updates = onFlush.mock.calls[0][0] as Map<string, TestUpdate[]>;
      expect(updates.get('key1')).toEqual([createUpdate('a'), createUpdate('b')]);
    });

    it('should group different keys into a single callback', async () => {
      const onFlush = vi.fn();

      processor.processUpdate('key1', createUpdate('a'), onFlush);
      processor.processUpdate('key2', createUpdate('b'), onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const updates = onFlush.mock.calls[0][0] as Map<string, TestUpdate[]>;
      expect(updates.get('key1')).toEqual([createUpdate('a')]);
      expect(updates.get('key2')).toEqual([createUpdate('b')]);
    });

    it('should handle subsequent batches across different ticks', async () => {
      const onFlush = vi.fn();

      processor.processUpdate('key1', createUpdate('a'), onFlush);
      await vi.runAllTimersAsync();

      processor.processUpdate('key1', createUpdate('b'), onFlush);
      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(2);
    });
  });

  describe('processDelete', () => {
    it('should batch multiple deletions for the same key in the same tick', async () => {
      const onFlush = vi.fn();

      processor.processDelete('key1', 'a', onFlush);
      processor.processDelete('key1', 'b', onFlush);
      processor.processDelete('key1', 'c', onFlush);

      expect(onFlush).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.get('key1')).toEqual(['a', 'b', 'c']);
    });

    it('should group different keys into a single callback', async () => {
      const onFlush = vi.fn();

      processor.processDelete('key1', 'a', onFlush);
      processor.processDelete('key2', 'b', onFlush);
      processor.processDelete('key1', 'c', onFlush);

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.get('key1')).toEqual(['a', 'c']);
      expect(deletions.get('key2')).toEqual(['b']);
    });

    it('should handle subsequent batches across different ticks', async () => {
      const onFlush = vi.fn();

      processor.processDelete('key1', 'a', onFlush);
      await vi.runAllTimersAsync();

      processor.processDelete('key1', 'b', onFlush);
      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(2);

      const first = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(first.get('key1')).toEqual(['a']);

      const second = onFlush.mock.calls[1][0] as Map<string, string[]>;
      expect(second.get('key1')).toEqual(['b']);
    });

    it('should handle many keys simultaneously', async () => {
      const onFlush = vi.fn();

      for (let i = 0; i < 100; i++) {
        processor.processDelete(`key${i}`, `item${i}`, onFlush);
      }

      await vi.runAllTimersAsync();

      expect(onFlush).toHaveBeenCalledTimes(1);

      const deletions = onFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.size).toBe(100);
    });
  });

  describe('flush ordering', () => {
    it('should flush deletes before updates before adds', async () => {
      const callOrder: string[] = [];

      processor.processAdd('key1', createItem('a'), () => {
        callOrder.push('add');
      });
      processor.processUpdate('key1', createUpdate('b'), () => {
        callOrder.push('update');
      });
      processor.processDelete('key1', 'c', () => {
        callOrder.push('delete');
      });

      await vi.runAllTimersAsync();

      expect(callOrder).toEqual(['delete', 'update', 'add']);
    });

    it('should await each callback before starting the next', async () => {
      const callOrder: string[] = [];

      processor.processDelete('key1', 'a', async () => {
        callOrder.push('delete-start');
        await Promise.resolve();
        callOrder.push('delete-end');
      });
      processor.processUpdate('key1', createUpdate('b'), async () => {
        callOrder.push('update-start');
        await Promise.resolve();
        callOrder.push('update-end');
      });
      processor.processAdd('key1', createItem('c'), async () => {
        callOrder.push('add-start');
        await Promise.resolve();
        callOrder.push('add-end');
      });

      await vi.runAllTimersAsync();

      expect(callOrder).toEqual(['delete-start', 'delete-end', 'update-start', 'update-end', 'add-start', 'add-end']);
    });

    it('should keep add, update, and delete callbacks separate', async () => {
      const onAddFlush = vi.fn();
      const onUpdateFlush = vi.fn();
      const onDeleteFlush = vi.fn();

      processor.processAdd('key1', createItem('a'), onAddFlush);
      processor.processUpdate('key1', createUpdate('b'), onUpdateFlush);
      processor.processDelete('key1', 'c', onDeleteFlush);

      await vi.runAllTimersAsync();

      expect(onAddFlush).toHaveBeenCalledTimes(1);
      expect(onUpdateFlush).toHaveBeenCalledTimes(1);
      expect(onDeleteFlush).toHaveBeenCalledTimes(1);
    });

    it('should skip callbacks for empty operation types', async () => {
      const onAddFlush = vi.fn();
      const onDeleteFlush = vi.fn();

      // Only add and delete, no update
      processor.processAdd('key1', createItem('a'), onAddFlush);
      processor.processDelete('key1', 'b', onDeleteFlush);

      await vi.runAllTimersAsync();

      expect(onAddFlush).toHaveBeenCalledTimes(1);
      expect(onDeleteFlush).toHaveBeenCalledTimes(1);
    });
  });

  describe('mixed operations across keys', () => {
    it('should batch all operation types across multiple keys', async () => {
      const onAddFlush = vi.fn();
      const onUpdateFlush = vi.fn();
      const onDeleteFlush = vi.fn();

      processor.processAdd('key1', createItem('a'), onAddFlush);
      processor.processUpdate('key2', createUpdate('b'), onUpdateFlush);
      processor.processAdd('key2', createItem('c'), onAddFlush);
      processor.processDelete('key1', 'd', onDeleteFlush);
      processor.processUpdate('key1', createUpdate('e'), onUpdateFlush);

      await vi.runAllTimersAsync();

      const additions = onAddFlush.mock.calls[0][0] as Map<string, TestItem[]>;
      expect(additions.get('key1')).toEqual([createItem('a')]);
      expect(additions.get('key2')).toEqual([createItem('c')]);

      const updates = onUpdateFlush.mock.calls[0][0] as Map<string, TestUpdate[]>;
      expect(updates.get('key1')).toEqual([createUpdate('e')]);
      expect(updates.get('key2')).toEqual([createUpdate('b')]);

      const deletions = onDeleteFlush.mock.calls[0][0] as Map<string, string[]>;
      expect(deletions.get('key1')).toEqual(['d']);
    });
  });
});
