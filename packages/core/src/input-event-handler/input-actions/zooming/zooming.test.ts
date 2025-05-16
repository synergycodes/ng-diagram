import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import {
  getSampleKeyboardEvent,
  getSamplePointerEvent,
  getSampleWheelEvent,
  mockEnvironment,
} from '../../../test-utils';
import { handlePointerEvent } from './handle-pointer-event';
import { handleWheelEvent } from './handle-wheel-event';
import { zoomingAction } from './zooming';

vi.mock('./handle-pointer-event');
vi.mock('./handle-wheel-event');

describe('zooming action', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 1 } } }),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
  });

  describe('predicate', () => {
    it('should return true for wheel events', () => {
      expect(zoomingAction.predicate(getSampleWheelEvent(), mockFlowCore)).toBe(true);
    });

    it('should return true for pointer events', () => {
      expect(zoomingAction.predicate(getSamplePointerEvent(), mockFlowCore)).toBe(true);
    });

    it('should return false for other events', () => {
      expect(zoomingAction.predicate(getSampleKeyboardEvent(), mockFlowCore)).toBe(false);
    });
  });

  describe('action', () => {
    it('should call handleWheelEvent when wheel event', () => {
      zoomingAction.action(getSampleWheelEvent(), mockFlowCore);

      expect(handleWheelEvent).toHaveBeenCalled();
    });

    it('should call handlePointerEvent when pointer event', () => {
      zoomingAction.action(getSamplePointerEvent(), mockFlowCore);

      expect(handlePointerEvent).toHaveBeenCalled();
    });

    it('should not call handleWheelEvent, nor handlePointerEvent when not wheel or pointer event', () => {
      zoomingAction.action(getSampleKeyboardEvent(), mockFlowCore);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
