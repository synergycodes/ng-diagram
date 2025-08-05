import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { NgDiagramMath } from '../../../math';
import { mockNode } from '../../../test-utils';
import { RotateInputEvent } from './rotate.event';
import { RotateEventHandler } from './rotate.handler';

vi.mock('../get-rotation-angle');
vi.mock('../../../math', () => ({
  NgDiagramMath: {
    distanceBetweenPoints: vi.fn(),
    angleBetweenPoints: vi.fn(),
    clamp: vi.fn(),
  },
}));

function getSampleRotateEvent(overrides: Partial<RotateInputEvent> = {}): RotateInputEvent {
  return {
    name: 'rotate',
    id: 'test-id',
    timestamp: Date.now(),
    modifiers: {
      primary: false,
      secondary: false,
      shift: false,
      meta: false,
    },
    target: mockNode,
    targetType: 'node',
    lastInputPoint: { x: 100, y: 100 },
    handle: { x: 120, y: 120 },
    center: { x: 110, y: 110 },
    ...overrides,
  };
}

describe('RotateEventHandler', () => {
  let flowCore: FlowCore;
  let mockCommandHandler: { emit: ReturnType<typeof vi.fn> };
  let instance: RotateEventHandler;

  const node = { ...mockNode, id: 'test-node' };

  beforeEach(() => {
    mockCommandHandler = { emit: vi.fn() };
    flowCore = {
      commandHandler: mockCommandHandler,
      clientToFlowPosition: vi.fn().mockImplementation((point) => point),
    } as unknown as FlowCore;
    instance = new RotateEventHandler(flowCore);
    vi.clearAllMocks();
  });

  describe('handle', () => {
    it('should not emit if mouse is too close to center', () => {
      vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(10);
      const event = getSampleRotateEvent({ target: node });

      instance.handle(event);
      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit rotateNodeBy with correct params if distance is sufficient', () => {
      vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(50);
      vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(42);
      const event = getSampleRotateEvent({ target: node });

      instance.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeBy', {
        nodeId: 'test-node',
        angle: 42,
      });
    });
  });
});
