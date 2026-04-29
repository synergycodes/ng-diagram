import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_DISCOVERY_WINDOW_TIMEOUT, MeasurementTracker } from './measurement-tracker';

describe('MeasurementTracker', () => {
  let tracker: MeasurementTracker;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new MeasurementTracker();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('requestTracking()', () => {
    it('should mark tracking as requested', () => {
      tracker.requestTracking();

      expect(tracker.isTrackingRequested()).toBe(true);
    });

    it('should not be requested initially', () => {
      expect(tracker.isTrackingRequested()).toBe(false);
    });

    it('should store custom config values', () => {
      tracker.requestTracking({ discoveryWindowMs: 200, debounceMs: 100 });
      tracker.registerParticipants(['node:node1']);

      vi.advanceTimersByTime(199);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should use default config when called without arguments', () => {
      tracker.requestTracking();
      tracker.registerParticipants(['node:node1']);

      vi.advanceTimersByTime(DEFAULT_DISCOVERY_WINDOW_TIMEOUT - 1);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('registerParticipants()', () => {
    it('should register entities and start discovery window', () => {
      tracker.requestTracking();
      tracker.registerParticipants(['node:node1', 'edge:edge1']);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should consume pending config', () => {
      tracker.requestTracking();
      tracker.registerParticipants(['node:node1']);

      expect(tracker.isTrackingRequested()).toBe(false);
    });

    it('should clear pending config even for empty entity list', () => {
      tracker.requestTracking();
      tracker.registerParticipants([]);

      expect(tracker.isTrackingRequested()).toBe(false);
    });

    it('should not have pending measurements for empty entity list (no-op)', () => {
      tracker.requestTracking();
      tracker.registerParticipants([]);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should resolve waitForMeasurements immediately for empty entity list', async () => {
      tracker.requestTracking();
      tracker.registerParticipants([]);

      const result = tracker.waitForMeasurements();
      await expect(result).resolves.toBeUndefined();
    });

    it('should start discovery window with configured discoveryWindowMs', () => {
      tracker.requestTracking({ discoveryWindowMs: 200 });
      tracker.registerParticipants(['node:node1']);

      vi.advanceTimersByTime(199);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('signalObserverActivity() — ResizeObserver early signal', () => {
    it('should extend discovery window when remaining time is below threshold', () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Advance to leave less than OBSERVER_ACTIVITY_MIN_REMAINING (40ms)
      vi.advanceTimersByTime(15);

      // Observer fires with 35ms remaining (< 40ms) → should extend to full 50ms
      tracker.signalObserverActivity('node:node1');

      // Should NOT expire at original time (50ms)
      vi.advanceTimersByTime(35);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      // Should expire at 15 + 50 = 65ms
      vi.advanceTimersByTime(15);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not extend discovery window when remaining time is exactly at threshold', () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Advance 10ms → exactly 40ms remaining (= threshold, NOT < threshold)
      vi.advanceTimersByTime(10);

      tracker.signalObserverActivity('node:node1');

      // Should still expire at original 50ms (no extension)
      vi.advanceTimersByTime(40);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not extend discovery window when remaining time is above threshold', () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Advance only 5ms → 45ms remaining (> 40ms threshold)
      vi.advanceTimersByTime(5);

      // Observer fires but plenty of time remaining → should not extend
      tracker.signalObserverActivity('node:node1');

      // Should still expire at original 50ms
      vi.advanceTimersByTime(45);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should ignore signals for non-participant entities', () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      vi.advanceTimersByTime(15);
      tracker.signalObserverActivity('node:untracked');

      // Should still expire at original 50ms
      vi.advanceTimersByTime(35);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should extend debounce when remaining time is below threshold', () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Transition to debounce
      tracker.signalMeasurement('node:node1');

      // Advance to leave less than OBSERVER_ACTIVITY_MIN_REMAINING (40ms)
      vi.advanceTimersByTime(15);

      // Observer fires with 35ms remaining (< 40ms) → should extend to full 50ms
      tracker.signalObserverActivity('node:node1');

      // Should NOT expire at original time (50ms from measurement)
      vi.advanceTimersByTime(35);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      // Should expire at 15 + 50 = 65ms from measurement
      vi.advanceTimersByTime(15);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not extend debounce when remaining time is exactly at threshold', () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:node1');

      // Advance 10ms → exactly 40ms remaining (= threshold, NOT < threshold)
      vi.advanceTimersByTime(10);

      tracker.signalObserverActivity('node:node1');

      // Should still expire at original 50ms from measurement (no extension)
      vi.advanceTimersByTime(40);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not extend debounce when remaining time is above threshold', () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Transition to debounce
      tracker.signalMeasurement('node:node1');

      // Advance only 5ms → 45ms remaining (> 40ms threshold)
      vi.advanceTimersByTime(5);

      // Observer fires but plenty of time remaining → should not extend
      tracker.signalObserverActivity('node:node1');

      // Should still expire at original 50ms from measurement
      vi.advanceTimersByTime(45);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should be ignored during idle phase', () => {
      tracker.signalObserverActivity('node:node1');

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple observer signals extending the discovery window', () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // First observer signal at 15ms → 35ms remaining (< 40ms) → extends to 65ms
      vi.advanceTimersByTime(15);
      tracker.signalObserverActivity('node:node1');

      // Second observer signal at 30ms → 35ms remaining (< 40ms) → extends to 80ms
      vi.advanceTimersByTime(15);
      tracker.signalObserverActivity('node:node1');

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('signalMeasurement()', () => {
    it('should transition from discovery window to debounce phase', () => {
      tracker.requestTracking({ discoveryWindowMs: 100, debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Signal measurement at 20ms → transitions to debounce
      vi.advanceTimersByTime(20);
      tracker.signalMeasurement('node:node1');

      // Should NOT resolve at original discovery window time (100ms)
      vi.advanceTimersByTime(30);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      // Should resolve at 20 + 50 = 70ms (debounce from measurement)
      // We're at 50ms now, need 20 more
      vi.advanceTimersByTime(20);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should reset debounce on subsequent measurements', () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // First measurement → debounce starts
      tracker.signalMeasurement('node:node1');

      // Second measurement at 30ms → debounce resets
      vi.advanceTimersByTime(30);
      tracker.signalMeasurement('node:node1');

      // 30ms after reset — not yet expired
      vi.advanceTimersByTime(30);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      // 50ms after reset — expired
      vi.advanceTimersByTime(20);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should ignore signals for non-participant entities', () => {
      tracker.requestTracking({ discoveryWindowMs: 100 });
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:untracked');

      // Should still be in discovery window, not debounce
      vi.advanceTimersByTime(100);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should ignore signals during idle phase', () => {
      tracker.signalMeasurement('node:node1');

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should use custom debounce timeout from config', () => {
      tracker.requestTracking({ debounceMs: 100 });
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:node1');

      vi.advanceTimersByTime(99);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('waitForMeasurements()', () => {
    it('should resolve immediately when no pending measurements', async () => {
      const result = tracker.waitForMeasurements();

      await expect(result).resolves.toBeUndefined();
    });

    it('should resolve when discovery window expires with no activity', async () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      const promise = tracker.waitForMeasurements();
      let resolved = false;
      promise.then(() => (resolved = true));

      expect(resolved).toBe(false);

      vi.advanceTimersByTime(50);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should resolve when debounce expires after measurement', async () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:node1');

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(50);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should return same promise for multiple waiters', () => {
      tracker.requestTracking();
      tracker.registerParticipants(['node:node1']);

      const promise1 = tracker.waitForMeasurements();
      const promise2 = tracker.waitForMeasurements();

      expect(promise1).toBe(promise2);
    });

    it('should resolve all waiters when measurements complete', async () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:node1');

      const results: string[] = [];
      const promise1 = tracker.waitForMeasurements().then(() => results.push('waiter1'));
      const promise2 = tracker.waitForMeasurements().then(() => results.push('waiter2'));

      vi.advanceTimersByTime(50);

      await Promise.all([promise1, promise2]);

      expect(results).toContain('waiter1');
      expect(results).toContain('waiter2');
    });

    it('should create new promise after previous measurements complete', async () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      const promise1 = tracker.waitForMeasurements();
      vi.advanceTimersByTime(50);
      await promise1;

      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node2']);

      const promise2 = tracker.waitForMeasurements();

      expect(promise1).not.toBe(promise2);
    });
  });

  describe('hasPendingMeasurements()', () => {
    it('should return false initially', () => {
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should return true during discovery window', () => {
      tracker.requestTracking();
      tracker.registerParticipants(['node:node1']);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should return true during debounce phase', () => {
      tracker.requestTracking();
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:node1');

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should return false after discovery window expires', () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should return false after debounce expires', () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:node1');
      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('two-phase timing model', () => {
    it('should complete via discovery window when no measurement arrives', async () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(50);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should complete via debounce when measurement arrives during discovery window', async () => {
      tracker.requestTracking({ discoveryWindowMs: 100, debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Measurement at 30ms → transitions to debounce
      vi.advanceTimersByTime(30);
      tracker.signalMeasurement('node:node1');

      const promise = tracker.waitForMeasurements();

      // Debounce expires at 30 + 50 = 80ms
      vi.advanceTimersByTime(50);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should extend discovery window with observer signal then transition to debounce', async () => {
      tracker.requestTracking({ discoveryWindowMs: 50, debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      // Observer signal at 15ms → 35ms remaining (< 40ms) → extends to 65ms
      vi.advanceTimersByTime(15);
      tracker.signalObserverActivity('node:node1');

      // Measurement at 45ms → transitions to debounce (expires at 95ms)
      vi.advanceTimersByTime(30);
      tracker.signalMeasurement('node:node1');

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(50);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle rapid consecutive measurements in debounce', async () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1']);

      tracker.signalMeasurement('node:node1');

      for (let i = 0; i < 10; i++) {
        tracker.signalMeasurement('node:node1');
        vi.advanceTimersByTime(10);
      }

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple participants with different signal timing', async () => {
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node1', 'node:node2', 'edge:edge1']);

      tracker.signalMeasurement('node:node1');
      vi.advanceTimersByTime(20);

      tracker.signalMeasurement('node:node2');
      vi.advanceTimersByTime(20);

      tracker.signalMeasurement('edge:edge1');
      vi.advanceTimersByTime(20);

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(30);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle duplicate entity IDs gracefully', () => {
      tracker.requestTracking();
      tracker.registerParticipants(['node:node1', 'node:node1']);

      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should handle signal before registration', () => {
      tracker.signalMeasurement('node:node1');

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple sequential tracking sessions', async () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);
      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);

      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node2']);

      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(50);

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should reset state between sessions', async () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1']);
      vi.advanceTimersByTime(50);

      // New session
      tracker.requestTracking({ debounceMs: 50 });
      tracker.registerParticipants(['node:node2']);

      // Signal for new session should work
      tracker.signalMeasurement('node:node2');

      vi.advanceTimersByTime(49);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      vi.advanceTimersByTime(1);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should not resolve discovery window early when observer fires for different participant', () => {
      tracker.requestTracking({ discoveryWindowMs: 50 });
      tracker.registerParticipants(['node:node1', 'node:node2']);

      // Observer signal for node2 at 15ms → 35ms remaining (< 40ms) → extends to 65ms
      vi.advanceTimersByTime(15);
      tracker.signalObserverActivity('node:node2');

      // Should NOT have expired at 50ms
      vi.advanceTimersByTime(35);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      // Should expire at 65ms
      vi.advanceTimersByTime(15);
      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });
});
