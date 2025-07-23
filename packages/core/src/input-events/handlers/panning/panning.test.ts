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

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
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

        // Verify internal state by testing subsequent continue phase
        const continueEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });

        instance.handle(continueEvent);

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
      });

      it('should emit moveViewportBy with correct delta', () => {
        const event = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 120 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 20 });
      });

      it('should calculate movement relative to last position after multiple moves', () => {
        // First move
        const firstEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 110, y: 110 },
        });
        instance.handle(firstEvent);

        // Second move
        const secondEvent = getSamplePanningEvent({
          phase: 'continue',
          lastInputPoint: { x: 120, y: 125 },
        });
        instance.handle(secondEvent);

        // Should calculate delta from previous position (110,110) to new position (120,125)
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveViewportBy', { x: 10, y: 15 });
      });

      it('should not emit when not panning', () => {
        // Create a fresh instance (not panning)
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
        // Start panning first
        const startEvent = getSamplePanningEvent({
          phase: 'start',
          lastInputPoint: { x: 100, y: 100 },
        });
        instance.handle(startEvent);
        vi.clearAllMocks();
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

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });
  });
});
