/* eslint-disable @typescript-eslint/no-empty-function */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowStateUpdate } from '../types';
import { DEFAULT_INITIAL_TIMEOUT, MeasurementTracker } from './measurement-tracker';

describe('MeasurementTracker', () => {
  let tracker: MeasurementTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new MeasurementTracker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('trackStateUpdate()', () => {
    it('should track nodes to add', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [
          { id: 'node1', position: { x: 0, y: 0 }, data: {} },
          { id: 'node2', position: { x: 100, y: 100 }, data: {} },
        ],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should track nodes to update', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToUpdate: [{ id: 'node1' }, { id: 'node2' }],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should track edges to add', () => {
      const stateUpdate: FlowStateUpdate = {
        edgesToAdd: [{ id: 'edge1', source: 'n1', target: 'n2', data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should track edges to update', () => {
      const stateUpdate: FlowStateUpdate = {
        edgesToUpdate: [{ id: 'edge1' }],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should track mixed entities', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
        nodesToUpdate: [{ id: 'node2' }],
        edgesToAdd: [{ id: 'edge1', source: 'n1', target: 'n2', data: {} }],
        edgesToUpdate: [{ id: 'edge2' }],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should not have pending measurements for empty state update', () => {
      const stateUpdate: FlowStateUpdate = {};

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should start initial timeout when tracking begins', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(DEFAULT_INITIAL_TIMEOUT);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should use custom initial timeout', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, undefined, 500);

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(499);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not restart initial timeout if already started', () => {
      const stateUpdate1: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };
      const stateUpdate2: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node2', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate1, undefined, 500);

      vi.advanceTimersByTime(300);

      tracker.trackStateUpdate(stateUpdate2, undefined, 500);

      vi.advanceTimersByTime(200);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('signalNodeMeasurement()', () => {
    it('should cancel initial timeout and start debounce', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);

      vi.advanceTimersByTime(100);
      tracker.signalNodeMeasurement('node1');

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should reset debounce timeout on subsequent activity', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);
      tracker.signalNodeMeasurement('node1');

      vi.advanceTimersByTime(30);
      tracker.signalNodeMeasurement('node1');

      vi.advanceTimersByTime(30);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(20);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should ignore signals for untracked nodes', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 500);

      tracker.signalNodeMeasurement('untracked-node');

      vi.advanceTimersByTime(499);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should use custom debounce timeout', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 100, 2000);
      tracker.signalNodeMeasurement('node1');

      vi.advanceTimersByTime(99);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('signalEdgeMeasurement()', () => {
    it('should cancel initial timeout and start debounce for edges', () => {
      const stateUpdate: FlowStateUpdate = {
        edgesToAdd: [{ id: 'edge1', source: 'n1', target: 'n2', data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);
      tracker.signalEdgeMeasurement('edge1');

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should ignore signals for untracked edges', () => {
      const stateUpdate: FlowStateUpdate = {
        edgesToAdd: [{ id: 'edge1', source: 'n1', target: 'n2', data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 500);
      tracker.signalEdgeMeasurement('untracked-edge');

      vi.advanceTimersByTime(500);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('waitForMeasurements()', () => {
    it('should resolve immediately when no pending measurements', async () => {
      const result = tracker.waitForMeasurements();

      await expect(result).resolves.toBeUndefined();
    });

    it('should resolve when measurements complete via debounce', async () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);
      tracker.signalNodeMeasurement('node1');

      const promise = tracker.waitForMeasurements();
      let resolved = false;
      promise.then(() => (resolved = true));

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(50);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should resolve when measurements complete via initial timeout', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 500);

      const promise = tracker.waitForMeasurements();
      let resolved = false;
      promise.then(() => (resolved = true));

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(500);
      await promise;

      expect(resolved).toBe(true);

      consoleSpy.mockRestore();
    });

    it('should return same promise for multiple waiters', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);

      const promise1 = tracker.waitForMeasurements();
      const promise2 = tracker.waitForMeasurements();

      expect(promise1).toBe(promise2);
    });

    it('should resolve all waiters when measurements complete', async () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);
      tracker.signalNodeMeasurement('node1');

      const results: string[] = [];
      const promise1 = tracker.waitForMeasurements().then(() => results.push('waiter1'));
      const promise2 = tracker.waitForMeasurements().then(() => results.push('waiter2'));

      vi.advanceTimersByTime(50);

      await Promise.all([promise1, promise2]);

      expect(results).toContain('waiter1');
      expect(results).toContain('waiter2');
    });

    it('should create new promise after previous measurements complete', async () => {
      const stateUpdate1: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate1, 50, 2000);
      tracker.signalNodeMeasurement('node1');

      const promise1 = tracker.waitForMeasurements();
      vi.advanceTimersByTime(50);
      await promise1;

      const stateUpdate2: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node2', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate2, 50, 2000);
      tracker.signalNodeMeasurement('node2');

      const promise2 = tracker.waitForMeasurements();

      expect(promise1).not.toBe(promise2);
    });
  });

  describe('hasPendingMeasurements()', () => {
    it('should return false initially', () => {
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should return true after tracking entities', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should return false after measurements complete', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);
      tracker.signalNodeMeasurement('node1');

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('timing model', () => {
    it('should complete via initial timeout when no activity received', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 500);

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(500);

      await promise;

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should complete via debounce when activity received', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 500);

      vi.advanceTimersByTime(100);
      tracker.signalNodeMeasurement('node1');

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(50);

      await promise;

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle rapid consecutive signals', async () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);

      for (let i = 0; i < 10; i++) {
        tracker.signalNodeMeasurement('node1');
        vi.advanceTimersByTime(10);
      }

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple tracked entities with different signal timing', async () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [
          { id: 'node1', position: { x: 0, y: 0 }, data: {} },
          { id: 'node2', position: { x: 100, y: 100 }, data: {} },
        ],
        edgesToAdd: [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }],
      };

      tracker.trackStateUpdate(stateUpdate, 50, 2000);

      tracker.signalNodeMeasurement('node1');
      vi.advanceTimersByTime(20);

      tracker.signalNodeMeasurement('node2');
      vi.advanceTimersByTime(20);

      tracker.signalEdgeMeasurement('edge1');
      vi.advanceTimersByTime(20);

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(30);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle tracking same entity multiple times', () => {
      const stateUpdate: FlowStateUpdate = {
        nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }],
        nodesToUpdate: [{ id: 'node1' }],
      };

      tracker.trackStateUpdate(stateUpdate);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should handle signal before tracking', () => {
      tracker.signalNodeMeasurement('node1');

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple sequential tracking sessions', async () => {
      tracker.trackStateUpdate({ nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }] }, 50, 500);
      tracker.signalNodeMeasurement('node1');
      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);

      tracker.trackStateUpdate({ nodesToAdd: [{ id: 'node2', position: { x: 0, y: 0 }, data: {} }] }, 50, 500);

      expect(tracker.hasPendingMeasurements()).toBe(true);

      tracker.signalNodeMeasurement('node2');
      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should reset hasReceivedActivity between sessions', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.trackStateUpdate({ nodesToAdd: [{ id: 'node1', position: { x: 0, y: 0 }, data: {} }] }, 50, 500);
      tracker.signalNodeMeasurement('node1');
      vi.advanceTimersByTime(50);

      tracker.trackStateUpdate({ nodesToAdd: [{ id: 'node2', position: { x: 0, y: 0 }, data: {} }] }, 50, 500);

      vi.advanceTimersByTime(500);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
