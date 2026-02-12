import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();

    const mockActionStateManager = {
      panning: undefined as { active: boolean } | undefined,
      clearPanning: vi.fn(() => {
        mockActionStateManager.panning = undefined;
      }),
      isPanning: vi.fn(() => !!mockActionStateManager.panning?.active),
    };

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      actionStateManager: mockActionStateManager,
      environment: mockEnvironment,
    } as unknown as FlowCore;

    instance = new PanningEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    describe('start phase', () => {
      it('should initialize panning state', () => {
        const event = getSamplePanningEvent({
          phase: 'start',
          lastInputPoint: { x: 100, y: 100 },
        });

        instance.handle(event);

        expect(mockFlowCore.actionStateManager.panning).toEqual({ active: true });
      });
    });

    describe('continue phase', () => {
      beforeEach(() => {
        const startEvent = getSamplePanningEvent({
          phase: 'start',
          lastInputPoint: { x: 100, y: 100 },
        });
        instance.handle(startEvent);
        vi.clearAllMocks();
      });

      it('should emit moveViewportBy immediately on each move', () => {
        const event = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 120 },
        });

        instance.handle(event);

        // Should emit immediately (no RAF throttling)
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 20 });
      });

      it('should emit on every move event', () => {
        const firstEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });
        instance.handle(firstEvent);

        const secondEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 120, y: 125 },
        });
        instance.handle(secondEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledTimes(2);
        expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(1, 'moveViewportBy', { x: 10, y: 10 });
        expect(mockCommandHandler.emit).toHaveBeenNthCalledWith(2, 'moveViewportBy', { x: 10, y: 15 });
      });

      it('should not emit when not panning', () => {
        const freshInstance = new PanningEventHandler(mockFlowCore);

        const event = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        freshInstance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });

    describe('end phase', () => {
      beforeEach(() => {
        const startEvent = getSamplePanningEvent({
          phase: 'start',
          lastInputPoint: { x: 100, y: 100 },
        });
        instance.handle(startEvent);
        vi.clearAllMocks();
      });

      it('should clear panning state', () => {
        const endEvent = getSamplePanningEvent({
          phase: 'end',
        });

        instance.handle(endEvent);

        expect(mockFlowCore.actionStateManager.clearPanning).toHaveBeenCalled();
      });

      it('should stop panning after end', () => {
        const endEvent = getSamplePanningEvent({
          phase: 'end',
        });

        instance.handle(endEvent);

        const continueEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        instance.handle(continueEvent);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });
  });
});
