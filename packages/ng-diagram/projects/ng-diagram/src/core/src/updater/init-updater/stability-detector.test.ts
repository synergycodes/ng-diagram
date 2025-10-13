import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StabilityDetector } from './stability-detector';

describe('StabilityDetector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a detector with shouldWait=true', () => {
      const detector = new StabilityDetector(true, 50);
      expect(detector).toBeDefined();
    });

    it('should create a detector with shouldWait=false', () => {
      const detector = new StabilityDetector(false, 50);
      expect(detector).toBeDefined();
    });
  });

  describe('notify', () => {
    it('should accept notify calls', () => {
      const detector = new StabilityDetector(true, 50);
      expect(() => detector.notify()).not.toThrow();
    });

    it('should accept multiple notify calls', () => {
      const detector = new StabilityDetector(true, 50);
      detector.notify();
      detector.notify();
      detector.notify();
      expect(() => detector.notify()).not.toThrow();
    });
  });

  describe('waitForStability with shouldWait=false', () => {
    it('should resolve immediately', async () => {
      const detector = new StabilityDetector(false, 50);

      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      // Should resolve immediately without advancing timers
      await promise;
      expect(resolved).toBe(true);
    });

    it('should resolve immediately even after notify calls', async () => {
      const detector = new StabilityDetector(false, 50);

      detector.notify();
      detector.notify();

      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('waitForStability with shouldWait=true', () => {
    it('should not resolve immediately when no events', async () => {
      const detector = new StabilityDetector(true, 50);

      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      // Check immediately - should not be resolved yet
      await Promise.resolve();
      expect(resolved).toBe(false);

      // Now advance timers to complete
      vi.advanceTimersByTime(50);
      await promise;
      expect(resolved).toBe(true);
    });

    it('should resolve after delay when no events', async () => {
      const detector = new StabilityDetector(true, 50);

      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      vi.advanceTimersByTime(50);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should not resolve immediately after notify', async () => {
      const detector = new StabilityDetector(true, 50);

      detector.notify();

      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      // Check immediately - should not be resolved yet
      await Promise.resolve();
      expect(resolved).toBe(false);

      // Now advance timers to complete
      vi.advanceTimersByTime(50);
      await promise;
      expect(resolved).toBe(true);
    });

    it('should resolve after delay following notify', async () => {
      const detector = new StabilityDetector(true, 50);

      detector.notify();
      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      vi.advanceTimersByTime(50);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should reset timer on subsequent notify calls', async () => {
      const detector = new StabilityDetector(true, 50);

      detector.notify();
      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      // Advance 30ms
      vi.advanceTimersByTime(30);

      // Notify again - should reset timer
      detector.notify();

      // Advance 30ms more (total 60ms, but only 30ms since last notify)
      vi.advanceTimersByTime(30);

      // Should NOT be resolved yet
      await Promise.resolve();
      expect(resolved).toBe(false);

      // Advance final 20ms to complete the 50ms since last notify
      vi.advanceTimersByTime(20);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should handle multiple notify calls before stability', async () => {
      const detector = new StabilityDetector(true, 50);

      detector.notify();
      detector.notify();
      detector.notify();

      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      vi.advanceTimersByTime(50);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should handle notify calls interspersed with time advances', async () => {
      const detector = new StabilityDetector(true, 100);

      detector.notify();
      vi.advanceTimersByTime(40);

      detector.notify(); // Reset timer
      vi.advanceTimersByTime(40);

      detector.notify(); // Reset timer again
      vi.advanceTimersByTime(40);

      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      // Should NOT be resolved yet (only 40ms since last notify)
      await Promise.resolve();
      expect(resolved).toBe(false);

      // Complete the remaining 60ms
      vi.advanceTimersByTime(60);
      await promise;

      expect(resolved).toBe(true);
    });
  });

  describe('stability with different delays', () => {
    it('should respect custom stability delay of 10ms', async () => {
      const detector = new StabilityDetector(true, 10);

      detector.notify();
      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      vi.advanceTimersByTime(10);
      await promise;

      expect(resolved).toBe(true);
    });

    it('should respect custom stability delay of 200ms', async () => {
      const detector = new StabilityDetector(true, 200);

      detector.notify();
      let resolved = false;
      const promise = detector.waitForStability().then(() => {
        resolved = true;
      });

      // Should not resolve at 100ms
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(resolved).toBe(false);

      // Should resolve at 200ms
      vi.advanceTimersByTime(100);
      await promise;

      expect(resolved).toBe(true);
    });
  });

  describe('multiple waitForStability calls', () => {
    it('should allow multiple calls to waitForStability', async () => {
      const detector = new StabilityDetector(true, 50);

      detector.notify();

      let resolved1 = false;
      let resolved2 = false;
      const promise1 = detector.waitForStability().then(() => {
        resolved1 = true;
      });
      const promise2 = detector.waitForStability().then(() => {
        resolved2 = true;
      });

      vi.advanceTimersByTime(50);

      await Promise.all([promise1, promise2]);

      expect(resolved1).toBe(true);
      expect(resolved2).toBe(true);
    });
  });
});
