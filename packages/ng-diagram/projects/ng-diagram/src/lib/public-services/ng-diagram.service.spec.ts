import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DEBOUNCE_TIMEOUT,
  DEFAULT_DISCOVERY_WINDOW_TIMEOUT,
  MeasurementTracker,
} from '../../core/src/measurement-tracker/measurement-tracker';
import { BatchResizeObserverService } from '../services/flow-resize-observer/batched-resize-observer.service';
import { FlowCoreProviderService } from '../services/flow-core-provider/flow-core-provider.service';
import { ManualLinkingService } from '../services/input-events/manual-linking.service';
import { RendererService } from '../services/renderer/renderer.service';
import { NgDiagramService } from './ng-diagram.service';

/** Resolves once the microtask queue has drained, so a settled promise can be observed. */
const flushMicrotasks = () => Promise.resolve().then(() => undefined);

const settled = async (promise: Promise<void>): Promise<boolean> => {
  let done = false;
  void promise.then(() => (done = true));
  await flushMicrotasks();
  return done;
};

describe('NgDiagramService', () => {
  let service: NgDiagramService;
  let tracker: MeasurementTracker;
  let batchResizeObserver: {
    invalidateAll: ReturnType<typeof vi.fn>;
    invalidateNode: ReturnType<typeof vi.fn>;
    invalidateEdgeLabels: ReturnType<typeof vi.fn>;
  };
  let provide: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    tracker = new MeasurementTracker();

    batchResizeObserver = {
      invalidateAll: vi.fn().mockReturnValue([]),
      invalidateNode: vi.fn().mockReturnValue([]),
      invalidateEdgeLabels: vi.fn().mockReturnValue([]),
    };

    provide = vi.fn().mockReturnValue({ measurementTracker: tracker });

    TestBed.configureTestingModule({
      providers: [
        NgDiagramService,
        { provide: FlowCoreProviderService, useValue: { provide } },
        { provide: BatchResizeObserverService, useValue: batchResizeObserver },
        { provide: ManualLinkingService, useValue: { startLinking: vi.fn() } },
        { provide: RendererService, useValue: { isInitialized: signal(false) } },
      ],
    });

    service = TestBed.inject(NgDiagramService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('invalidateMeasurements', () => {
    it('should invalidate every observed element when called with no options', async () => {
      batchResizeObserver.invalidateAll.mockReturnValue(['node:n1', 'edge:e1']);

      const promise = service.invalidateMeasurements();

      expect(batchResizeObserver.invalidateAll).toHaveBeenCalledTimes(1);
      expect(batchResizeObserver.invalidateNode).not.toHaveBeenCalled();
      expect(tracker.hasPendingMeasurements()).toBe(true);

      await vi.advanceTimersByTimeAsync(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve a full invalidation only after the measurements have been applied', async () => {
      batchResizeObserver.invalidateAll.mockReturnValue(['node:n1', 'edge:e1']);

      const promise = service.invalidateMeasurements();

      // A measurement arrives mid-discovery — settling now waits out the debounce.
      await vi.advanceTimersByTimeAsync(20);
      tracker.signalMeasurement('node:n1');

      await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_TIMEOUT - 1);
      expect(await settled(promise)).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(await settled(promise)).toBe(true);
    });

    it('should invalidate only the targeted nodes and edges', async () => {
      batchResizeObserver.invalidateNode.mockReturnValue(['node:n1']);
      batchResizeObserver.invalidateEdgeLabels.mockReturnValue(['edge:e1']);

      const promise = service.invalidateMeasurements({ nodes: [{ nodeId: 'n1' }], edges: [{ edgeId: 'e1' }] });

      expect(batchResizeObserver.invalidateAll).not.toHaveBeenCalled();
      expect(batchResizeObserver.invalidateNode).toHaveBeenCalledWith('n1');
      expect(batchResizeObserver.invalidateEdgeLabels).toHaveBeenCalledWith('e1');

      await vi.advanceTimersByTimeAsync(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve a selective invalidation only after the measurements have been applied', async () => {
      batchResizeObserver.invalidateNode.mockReturnValue(['node:n1']);

      const promise = service.invalidateMeasurements({ nodes: [{ nodeId: 'n1' }] });

      await vi.advanceTimersByTimeAsync(20);
      tracker.signalMeasurement('node:n1');

      await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_TIMEOUT - 1);
      expect(await settled(promise)).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(await settled(promise)).toBe(true);
    });

    it('should track only the entities that actually had observed elements', async () => {
      batchResizeObserver.invalidateNode.mockImplementation((nodeId: string) =>
        nodeId === 'mounted' ? ['node:mounted'] : []
      );

      const promise = service.invalidateMeasurements({
        nodes: [{ nodeId: 'mounted' }, { nodeId: 'unmounted' }],
      });

      // 'node:unmounted' is not a participant, so its signals cannot keep the promise alive.
      tracker.signalMeasurement('node:unmounted');
      expect(tracker.hasPendingMeasurements()).toBe(true);

      await vi.advanceTimersByTimeAsync(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);
      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve when an invalidated element never delivers a measurement', async () => {
      batchResizeObserver.invalidateNode.mockReturnValue(['node:n1']);

      const promise = service.invalidateMeasurements({ nodes: [{ nodeId: 'n1' }] });

      expect(await settled(promise)).toBe(false);

      // No measurement ever arrives — the discovery window expires on its own.
      await vi.advanceTimersByTimeAsync(DEFAULT_DISCOVERY_WINDOW_TIMEOUT);
      expect(await settled(promise)).toBe(true);
    });

    it('should resolve immediately and not touch the core when nothing is observed', async () => {
      const promise = service.invalidateMeasurements({ nodes: [{ nodeId: 'missing' }] });

      expect(batchResizeObserver.invalidateNode).toHaveBeenCalledWith('missing');
      expect(provide).not.toHaveBeenCalled();
      expect(tracker.hasPendingMeasurements()).toBe(false);
      expect(await settled(promise)).toBe(true);
    });

    it('should keep working fire-and-forget — the invalidation happens synchronously', () => {
      batchResizeObserver.invalidateNode.mockReturnValue(['node:n1']);

      expect(() => service.invalidateMeasurements({ nodes: [{ nodeId: 'n1' }] })).not.toThrow();

      expect(batchResizeObserver.invalidateNode).toHaveBeenCalledWith('n1');
      expect(tracker.hasPendingMeasurements()).toBe(true);
    });

    it('should resolve a full invalidation immediately when nothing is observed', async () => {
      const promise = service.invalidateMeasurements();

      expect(batchResizeObserver.invalidateAll).toHaveBeenCalledTimes(1);
      expect(provide).not.toHaveBeenCalled();
      expect(await settled(promise)).toBe(true);
    });

    it('should treat empty options as a no-op rather than a full invalidation', async () => {
      const promise = service.invalidateMeasurements({});

      expect(batchResizeObserver.invalidateAll).not.toHaveBeenCalled();
      expect(batchResizeObserver.invalidateNode).not.toHaveBeenCalled();
      expect(batchResizeObserver.invalidateEdgeLabels).not.toHaveBeenCalled();
      expect(await settled(promise)).toBe(true);
    });

    it('should resolve an edge-label invalidation only after the label measurements have been applied', async () => {
      batchResizeObserver.invalidateEdgeLabels.mockReturnValue(['edge:e1']);

      const promise = service.invalidateMeasurements({ edges: [{ edgeId: 'e1' }] });

      await vi.advanceTimersByTimeAsync(20);
      tracker.signalMeasurement('edge:e1');

      await vi.advanceTimersByTimeAsync(DEFAULT_DEBOUNCE_TIMEOUT - 1);
      expect(await settled(promise)).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(await settled(promise)).toBe(true);
    });

    it('should settle overlapping invalidations together, unaffected by the previous round debounce', async () => {
      batchResizeObserver.invalidateNode.mockImplementation((nodeId: string) => [`node:${nodeId}`]);

      const first = service.invalidateMeasurements({ nodes: [{ nodeId: 'n1' }] });
      await vi.advanceTimersByTimeAsync(20);
      tracker.signalMeasurement('node:n1');

      // 30ms into the first round's 50ms debounce, a second invalidation starts.
      await vi.advanceTimersByTimeAsync(30);
      const second = service.invalidateMeasurements({ nodes: [{ nodeId: 'n2' }] });

      // The first round's debounce would have fired here — neither promise may resolve.
      await vi.advanceTimersByTimeAsync(20);
      expect(await settled(first)).toBe(false);
      expect(await settled(second)).toBe(false);

      // Both resolve when the second round's discovery window expires.
      await vi.advanceTimersByTimeAsync(DEFAULT_DISCOVERY_WINDOW_TIMEOUT - 20);
      expect(await settled(first)).toBe(true);
      expect(await settled(second)).toBe(true);
    });

    it('should throw synchronously on an uninitialized diagram rather than rejecting', () => {
      batchResizeObserver.invalidateNode.mockReturnValue(['node:n1']);
      provide.mockImplementation(() => {
        throw new Error('[ngDiagram] Library engine not initialized yet.');
      });

      expect(() => service.invalidateMeasurements({ nodes: [{ nodeId: 'n1' }] })).toThrow(
        'Library engine not initialized yet'
      );
    });
  });
});
