import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import { PanningEvent } from './panning.event';
import { PanningEventHandler } from './panning.handler';

function getSamplePanningEvent(overrides: Partial<PanningEvent> = {}): PanningEvent {
  return {
    name: 'panning',
    id: 'test-id',
    timestamp: Date.now(),
    modifiers: {
      primary: false,
      secondary: false,
      shift: false,
      meta: false,
    },
    target: undefined,
    targetType: 'diagram',
    lastInputPoint: { x: 100, y: 100 },
    phase: 'start',
    ...overrides,
  };
}

describe('PanningEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: PanningEventHandler;
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    vi.clearAllMocks();
    rafCallbacks = [];

    // Mock requestAnimationFrame to capture callbacks
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      eventManager: { emit: vi.fn() },
      environment: mockEnvironment,
    } as unknown as FlowCore;

    instance = new PanningEventHandler(mockFlowCore);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Flush all pending RAF callbacks */
  function flushRAF() {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach((cb) => cb(performance.now()));
  }

  describe('handle', () => {
    describe('start phase', () => {
      it('should initialize panning state', () => {
        const event = getSamplePanningEvent({
          phase: 'start',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        // Verify internal state by testing subsequent continue phase
        const continueEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        instance.handle(continueEvent);

        // Flush RAF to trigger the emit
        flushRAF();

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 10 });
      });
    });

    describe('continue phase', () => {
      beforeEach(() => {
        // Start panning first
        const startEvent = getSamplePanningEvent({
          phase: 'start',
          lastInputPoint: { x: 100, y: 100 },
        });
        instance.handle(startEvent);
        vi.clearAllMocks();
        rafCallbacks = [];
      });

      it('should emit moveViewportBy with correct delta after RAF', () => {
        const event = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 120 },
        });

        instance.handle(event);

        // Should not emit immediately
        expect(mockCommandHandler.emit).not.toHaveBeenCalled();

        // Flush RAF to trigger the emit
        flushRAF();

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 20 });
      });

      it('should accumulate multiple moves and emit once per RAF', () => {
        // First move
        const firstEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });
        instance.handle(firstEvent);

        // Second move (before RAF fires)
        const secondEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 120, y: 125 },
        });
        instance.handle(secondEvent);

        // Should not emit yet
        expect(mockCommandHandler.emit).not.toHaveBeenCalled();

        // Flush RAF - should emit accumulated delta (100,100) -> (120,125) = (20, 25)
        flushRAF();

        expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 20, y: 25 });
      });

      it('should not emit when not panning', () => {
        // Create a fresh instance (not panning)
        const freshInstance = new PanningEventHandler(mockFlowCore);

        const event = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        freshInstance.handle(event);
        flushRAF();

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });

    describe('end phase', () => {
      beforeEach(() => {
        // Start panning first
        const startEvent = getSamplePanningEvent({
          phase: 'start',
          lastInputPoint: { x: 100, y: 100 },
        });
        instance.handle(startEvent);
        vi.clearAllMocks();
        rafCallbacks = [];
      });

      it('should flush remaining delta immediately on end', () => {
        // Continue with some movement
        const continueEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });
        instance.handle(continueEvent);

        // End panning - should flush immediately without waiting for RAF
        const endEvent = getSamplePanningEvent({
          phase: 'end',
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 10 });
      });

      it('should stop panning and clear state', () => {
        const endEvent = getSamplePanningEvent({
          phase: 'end',
        });

        instance.handle(endEvent);

        // Verify panning stopped by trying to continue
        const continueEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        instance.handle(continueEvent);
        flushRAF();

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });
  });
});
