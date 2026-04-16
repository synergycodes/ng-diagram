/* eslint-disable @typescript-eslint/no-empty-function */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SAFETY_TIMEOUT, MeasurementTracker } from './measurement-tracker';

describe('MeasurementTracker', () => {
  let tracker: MeasurementTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new MeasurementTracker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setNextTrackingConfig()', () => {
    it('should mark tracking as requested', () => {
      tracker.setNextTrackingConfig();

      expect(tracker.isTrackingRequested()).toBe(true);
    });

    it('should not be requested initially', () => {
      expect(tracker.isTrackingRequested()).toBe(false);
    });

    it('should store custom debounce values', () => {
      tracker.setNextTrackingConfig(100, 500);
      tracker.trackEntities(['node:node1']);

      vi.advanceTimersByTime(99);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should use default debounce when called without arguments', () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities(['node:node1']);

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('trackEntities()', () => {
    it('should track entities as pending measurements', () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities(['node:node1', 'edge:edge1']);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should consume pending config', () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities(['node:node1']);

      expect(tracker.isTrackingRequested()).toBe(false);
    });

    it('should clear pending config even for empty entity list', () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities([]);

      expect(tracker.isTrackingRequested()).toBe(false);
    });

    it('should not have pending measurements for empty entity list (no-op)', () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities([]);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should resolve waitForMeasurements immediately for empty entity list', async () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities([]);

      const result = tracker.waitForMeasurements();
      await expect(result).resolves.toBeUndefined();
    });

    it('should signal activity immediately and start debounce', () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should use custom debounce from staged config', () => {
      tracker.setNextTrackingConfig(100, 2000);
      tracker.trackEntities(['node:node1']);

      vi.advanceTimersByTime(99);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('signalNodeMeasurement()', () => {
    it('should reset debounce timeout on subsequent activity', () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      // Subsequent signal at 30ms resets debounce
      vi.advanceTimersByTime(30);
      tracker.signalNodeMeasurement('node1');

      // 30ms after reset — not yet expired
      vi.advanceTimersByTime(30);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      // 50ms after reset — expired
      vi.advanceTimersByTime(20);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should ignore signals for untracked nodes', () => {
      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node1']);

      // Signal for an untracked node should not affect debounce
      tracker.signalNodeMeasurement('untracked-node');

      // Original debounce from trackEntities should still expire at 50ms
      vi.advanceTimersByTime(50);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should use custom debounce timeout from config', () => {
      tracker.setNextTrackingConfig(100, 2000);
      tracker.trackEntities(['node:node1']);

      // Subsequent signal resets debounce to 100ms
      vi.advanceTimersByTime(50);
      tracker.signalNodeMeasurement('node1');

      vi.advanceTimersByTime(99);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('signalEdgeMeasurement()', () => {
    it('should reset debounce for edges', () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['edge:edge1']);

      // Subsequent signal resets debounce
      vi.advanceTimersByTime(30);
      tracker.signalEdgeMeasurement('edge1');

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should ignore signals for untracked edges', () => {
      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['edge:edge1']);

      tracker.signalEdgeMeasurement('untracked-edge');

      vi.advanceTimersByTime(50);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('waitForMeasurements()', () => {
    it('should resolve immediately when no pending measurements', async () => {
      const result = tracker.waitForMeasurements();

      await expect(result).resolves.toBeUndefined();
    });

    it('should resolve when debounce completes', async () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      const promise = tracker.waitForMeasurements();
      let resolved = false;
      promise.then(() => (resolved = true));

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(50);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should return same promise for multiple waiters', () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      const promise1 = tracker.waitForMeasurements();
      const promise2 = tracker.waitForMeasurements();

      expect(promise1).toBe(promise2);
    });

    it('should resolve all waiters when measurements complete', async () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      const results: string[] = [];
      const promise1 = tracker.waitForMeasurements().then(() => results.push('waiter1'));
      const promise2 = tracker.waitForMeasurements().then(() => results.push('waiter2'));

      vi.advanceTimersByTime(50);

      await Promise.all([promise1, promise2]);

      expect(results).toContain('waiter1');
      expect(results).toContain('waiter2');
    });

    it('should create new promise after previous measurements complete', async () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      const promise1 = tracker.waitForMeasurements();
      vi.advanceTimersByTime(50);
      await promise1;

      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node2']);

      const promise2 = tracker.waitForMeasurements();

      expect(promise1).not.toBe(promise2);
    });
  });

  describe('hasPendingMeasurements()', () => {
    it('should return false initially', () => {
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should return true after tracking entities', () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities(['node:node1']);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should return false after debounce completes', () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('timing model', () => {
    it('should complete via debounce after trackEntities signals', async () => {
      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node1']);

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(50);

      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should extend debounce when subsequent signals arrive', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node1']);

      // Subsequent signal resets debounce
      vi.advanceTimersByTime(30);
      tracker.signalNodeMeasurement('node1');

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(50);

      await promise;

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle rapid consecutive signals', async () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      for (let i = 0; i < 10; i++) {
        tracker.signalNodeMeasurement('node1');
        vi.advanceTimersByTime(10);
      }

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple tracked entities with different signal timing', async () => {
      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1', 'node:node2', 'edge:edge1']);

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
    it('should handle duplicate entity IDs gracefully', () => {
      tracker.setNextTrackingConfig();
      tracker.trackEntities(['node:node1', 'node:node1']);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should handle signal before tracking', () => {
      tracker.signalNodeMeasurement('node1');

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple sequential tracking sessions', async () => {
      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node1']);
      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);

      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node2']);

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should reset state between sessions', async () => {
      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node1']);
      vi.advanceTimersByTime(50);

      // New session — subsequent signal should still work
      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node2']);

      // Subsequent signal resets debounce
      vi.advanceTimersByTime(30);
      tracker.signalNodeMeasurement('node2');

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('safety timeout', () => {
    it('should force-complete with warning when safety timeout fires', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node1']);

      const promise = tracker.waitForMeasurements();

      // Keep resetting debounce so it never expires on its own
      for (let i = 0; i < 20; i++) {
        vi.advanceTimersByTime(40);
        tracker.signalNodeMeasurement('node1');
      }

      // Safety timeout fires at 500ms total
      vi.advanceTimersByTime(500);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should not fire safety timeout when debounce completes normally', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.setNextTrackingConfig(50, 2000);
      tracker.trackEntities(['node:node1']);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
      expect(consoleSpy).not.toHaveBeenCalled();

      // Advance past safety timeout — should not warn (already cleared)
      vi.advanceTimersByTime(2000);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use default safety timeout', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.setNextTrackingConfig();
      tracker.trackEntities(['node:node1']);

      // Keep debounce alive past default safety timeout
      for (let i = 0; i < 100; i++) {
        vi.advanceTimersByTime(40);
        tracker.signalNodeMeasurement('node1');
      }

      vi.advanceTimersByTime(DEFAULT_SAFETY_TIMEOUT);

      expect(tracker.hasPendingMeasurements()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should use custom safety timeout', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.setNextTrackingConfig(50, 300);
      tracker.trackEntities(['node:node1']);

      // Keep debounce alive
      for (let i = 0; i < 10; i++) {
        vi.advanceTimersByTime(40);
        tracker.signalNodeMeasurement('node1');
      }

      vi.advanceTimersByTime(300);

      expect(tracker.hasPendingMeasurements()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should cancel safety timeout between sessions', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.setNextTrackingConfig(50, 500);
      tracker.trackEntities(['node:node1']);
      vi.advanceTimersByTime(50); // debounce completes, clears safety timeout

      // Safety timeout from first session should not fire
      vi.advanceTimersByTime(500);
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
