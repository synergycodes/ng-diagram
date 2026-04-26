/**
 * Integration tests for the measurement-tracking middleware + MeasurementTracker.
 *
 * Tests the full lifecycle: middleware registers participants → tracker manages timers →
 * subsequent middleware passes signal measurements → promise resolves.
 *
 * Helpers are constructed to represent what MiddlewareExecutor would produce
 * for each scenario (which properties changed on which entities).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DEBOUNCE_TIMEOUT,
  DEFAULT_DISCOVERY_WINDOW_TIMEOUT,
  MeasurementTracker,
} from '../../../measurement-tracker/measurement-tracker';
import { mockEnvironment } from '../../../test-utils';
import type { MiddlewareContext, MiddlewareHelpers } from '../../../types';
import { createMeasurementTrackingMiddleware } from './measurement-tracking.middleware';

function createHelpers(overrides: Partial<MiddlewareHelpers> = {}): MiddlewareHelpers {
  return {
    checkIfNodeChanged: () => false,
    checkIfEdgeChanged: () => false,
    checkIfNodeAdded: () => false,
    checkIfNodeRemoved: () => false,
    checkIfEdgeAdded: () => false,
    checkIfEdgeRemoved: () => false,
    checkIfAnyNodePropsChanged: () => false,
    checkIfAnyEdgePropsChanged: () => false,
    anyNodesAdded: () => false,
    anyEdgesAdded: () => false,
    anyNodesRemoved: () => false,
    anyEdgesRemoved: () => false,
    getAffectedNodeIds: () => [],
    getAffectedEdgeIds: () => [],
    getChangedNodeIds: () => [],
    getChangedEdgeIds: () => [],
    getAddedNodes: () => [],
    getAddedEdges: () => [],
    getRemovedNodes: () => [],
    getRemovedEdges: () => [],
    ...overrides,
  };
}

function createContext(helpers: MiddlewareHelpers): MiddlewareContext {
  return {
    modelActionType: 'updateNodes',
    modelActionTypes: ['updateNodes'],
    initialState: { nodes: [], edges: [], metadata: { viewport: { x: 0, y: 0, scale: 1 } } },
    state: { nodes: [], edges: [], metadata: { viewport: { x: 0, y: 0, scale: 1 } } },
    nodesMap: new Map(),
    edgesMap: new Map(),
    initialNodesMap: new Map(),
    initialEdgesMap: new Map(),
    initialUpdate: {},
    history: [],
    helpers,
    environment: mockEnvironment,
  } as unknown as MiddlewareContext;
}

describe('Measurement tracking integration', () => {
  let tracker: MeasurementTracker;
  let middleware: ReturnType<typeof createMeasurementTrackingMiddleware>;
  const next = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new MeasurementTracker();
    middleware = createMeasurementTrackingMiddleware(tracker);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Simulates the first middleware pass (transaction commit). */
  function firstPass(helpers: Partial<MiddlewareHelpers>) {
    tracker.requestTracking();
    middleware.execute(createContext(createHelpers(helpers)), next, () => null);
  }

  /** Simulates a subsequent middleware pass (measurement arriving via applyUpdate). */
  function subsequentPass(helpers: Partial<MiddlewareHelpers>) {
    middleware.execute(createContext(createHelpers(helpers)), next, () => null);
  }

  describe('empty transaction', () => {
    it('should resolve immediately when no entities changed', async () => {
      firstPass({});

      expect(tracker.hasPendingMeasurements()).toBe(false);
      await tracker.waitForMeasurements();
    });
  });

  describe('transaction with only position change (immediate, no deferred measurements)', () => {
    it('should resolve after discovery window expires with no subsequent signals', async () => {
      firstPass({
        getChangedNodeIds: () => ['node1'],
      });

      expect(tracker.hasPendingMeasurements()).toBe(true);
      const promise = tracker.waitForMeasurements();

      // No subsequent applyUpdate — discovery window expires
      vi.advanceTimersByTime(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('transaction with position + measuredPorts (both immediate in same applyUpdate)', () => {
    it('should resolve after discovery window — no subsequent pass triggers signals', async () => {
      // Both position and measuredPorts changed in the initial transaction applyUpdate.
      // The first pass only registers participants (no signalMeasurement).
      // No subsequent applyUpdate follows, so discovery window expires.
      firstPass({
        getChangedNodeIds: () => ['node1'],
      });

      const promise = tracker.waitForMeasurements();

      vi.advanceTimersByTime(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('transaction with data change → deferred measuredPorts (the original bug)', () => {
    it('should wait for measuredPorts to arrive via subsequent applyUpdate', async () => {
      // First pass: only "data" changed — in old implementation this resolved immediately
      firstPass({
        getChangedNodeIds: () => ['node1'],
      });

      expect(tracker.hasPendingMeasurements()).toBe(true);
      const promise = tracker.waitForMeasurements();

      // Later: Angular CD → port effect → updatePortsBulk → applyUpdate with measuredPorts
      vi.advanceTimersByTime(10);
      subsequentPass({
        checkIfAnyNodePropsChanged: (props) => props.includes('measuredPorts'),
        getAffectedNodeIds: () => ['node1'],
      });

      // Discovery window shut → now in debounce
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });

    it('should handle multiple measurement waves (fast path + slow path)', async () => {
      firstPass({
        getChangedNodeIds: () => ['node1'],
      });

      const promise = tracker.waitForMeasurements();

      // Wave 1: port side change (fast path via effect → microtask → updatePortsBulk)
      vi.advanceTimersByTime(5);
      subsequentPass({
        checkIfAnyNodePropsChanged: (props) => props.includes('measuredPorts'),
        getAffectedNodeIds: () => ['node1'],
      });

      // Wave 2: port size/position (slow path via ResizeObserver → double RAF)
      vi.advanceTimersByTime(30);
      subsequentPass({
        checkIfAnyNodePropsChanged: (props) => props.includes('measuredPorts'),
        getAffectedNodeIds: () => ['node1'],
      });

      // Debounce resets on wave 2
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('transaction with position + deferred measuredPorts (separate applyUpdates)', () => {
    it('should transition to debounce when measuredPorts arrives in subsequent pass', async () => {
      // First pass: position + data changed in the transaction
      firstPass({
        getChangedNodeIds: () => ['node1'],
      });

      const promise = tracker.waitForMeasurements();

      // Subsequent pass: measuredPorts arrives → signalMeasurement → discovery window shuts
      vi.advanceTimersByTime(15);
      subsequentPass({
        checkIfAnyNodePropsChanged: (props) => props.includes('measuredPorts'),
        getAffectedNodeIds: () => ['node1'],
      });

      // Should NOT resolve at discovery window time
      vi.advanceTimersByTime(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);

      // Should resolve after debounce from the measurement signal
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('transaction with edge label changes', () => {
    it('should wait for measuredLabels to arrive via subsequent applyUpdate', async () => {
      // First pass: edge data changed (label content will re-render)
      firstPass({
        getChangedEdgeIds: () => ['edge1'],
      });

      const promise = tracker.waitForMeasurements();

      // Later: ResizeObserver → double RAF → processEdgeLabelBatch → applyUpdate with measuredLabels
      vi.advanceTimersByTime(30);
      subsequentPass({
        checkIfAnyEdgePropsChanged: (props) => props.includes('measuredLabels'),
        getAffectedEdgeIds: () => ['edge1'],
      });

      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('transaction with mixed node + edge changes', () => {
    it('should track both and wait for all measurements to settle', async () => {
      firstPass({
        getChangedNodeIds: () => ['node1'],
        getChangedEdgeIds: () => ['edge1'],
      });

      const promise = tracker.waitForMeasurements();

      // Node measurement arrives first
      vi.advanceTimersByTime(10);
      subsequentPass({
        checkIfAnyNodePropsChanged: (props) => props.includes('measuredPorts'),
        getAffectedNodeIds: () => ['node1'],
      });

      // Edge measurement arrives later — debounce resets
      vi.advanceTimersByTime(20);
      subsequentPass({
        checkIfAnyEdgePropsChanged: (props) => props.includes('measuredLabels'),
        getAffectedEdgeIds: () => ['edge1'],
      });

      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('observer activity extends timers', () => {
    it('should extend discovery window when observer fires with little time remaining', async () => {
      firstPass({
        getChangedNodeIds: () => ['node1'],
      });

      const promise = tracker.waitForMeasurements();

      // Observer fires late in the discovery window
      vi.advanceTimersByTime(DEFAULT_DISCOVERY_WINDOW_TIMEOUT - 5);
      tracker.signalObserverActivity('node:node1');

      // Should NOT have resolved at original discovery window time
      vi.advanceTimersByTime(5);
      expect(tracker.hasPendingMeasurements()).toBe(true);

      // Measurement arrives after extension
      vi.advanceTimersByTime(10);
      subsequentPass({
        checkIfAnyNodePropsChanged: (props) => props.includes('measuredPorts'),
        getAffectedNodeIds: () => ['node1'],
      });

      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });

  describe('non-participant signals are ignored', () => {
    it('should not react to measurements for entities outside the transaction', async () => {
      firstPass({
        getChangedNodeIds: () => ['node1'],
      });

      const promise = tracker.waitForMeasurements();

      // Measurement for node2 (not a participant) — middleware signals it,
      // but tracker ignores because node2 is not in participantIds
      vi.advanceTimersByTime(10);
      subsequentPass({
        checkIfAnyNodePropsChanged: (props) => props.includes('measuredPorts'),
        getAffectedNodeIds: () => ['node2'],
      });

      // Discovery window still running for node1, expires normally
      vi.advanceTimersByTime(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);
      await promise;

      expect(tracker.hasPendingMeasurements()).toBe(false);
    });
  });
});
