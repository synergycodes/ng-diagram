import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { NgDiagramMath } from '../../../math';
import { mockNode } from '../../../test-utils';
import { RotationActionState } from '../../../types';
import { RotateInputEvent } from './rotate.event';
import { RotateEventHandler } from './rotate.handler';

vi.mock('../get-rotation-angle');
vi.mock('../../../math', () => ({
  NgDiagramMath: {
    distanceBetweenPoints: vi.fn(),
    angleBetweenPoints: vi.fn(),
    clamp: vi.fn(),
    normalizeAngle: vi.fn().mockImplementation((angle) => angle),
  },
}));

function getSampleRotateEvent(overrides: Partial<RotateInputEvent> = {}): RotateInputEvent {
  return {
    name: 'rotate',
    phase: 'continue',
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
    center: { x: 110, y: 110 },
    ...overrides,
  };
}

describe('RotateEventHandler', () => {
  let flowCore: FlowCore;
  let mockCommandHandler: { emit: ReturnType<typeof vi.fn> };
  let mockActionStateManager: { rotation: RotationActionState | undefined; clearRotation: ReturnType<typeof vi.fn> };
  let instance: RotateEventHandler;

  const node = { ...mockNode, id: 'test-node', angle: 30 };

  beforeEach(() => {
    mockCommandHandler = { emit: vi.fn() };
    mockActionStateManager = {
      rotation: undefined,
      clearRotation: vi.fn(),
    };
    flowCore = {
      commandHandler: mockCommandHandler,
      actionStateManager: mockActionStateManager,
      clientToFlowPosition: vi.fn().mockImplementation((point) => point),
      getNodeById: vi.fn().mockReturnValue(node),
    } as unknown as FlowCore;
    instance = new RotateEventHandler(flowCore);
    vi.clearAllMocks();
  });

  describe('handle', () => {
    describe('start phase', () => {
      it('should initialize rotation state', () => {
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(45);
        const event = getSampleRotateEvent({ target: node, phase: 'start' });

        instance.handle(event);

        expect(mockActionStateManager.rotation).toEqual({
          startAngle: 45,
          initialNodeAngle: 30,
          nodeId: 'test-node',
        });
        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });

    describe('continue phase', () => {
      it('should not emit if mouse is too close to center', () => {
        mockActionStateManager.rotation = {
          startAngle: 45,
          initialNodeAngle: 30,
          nodeId: 'test-node',
        };
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(10);
        const event = getSampleRotateEvent({ target: node, phase: 'continue' });

        instance.handle(event);
        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });

      it('should emit rotateNodeTo with correct params if distance is sufficient', () => {
        mockActionStateManager.rotation = {
          startAngle: 45,
          initialNodeAngle: 30,
          nodeId: 'test-node',
        };
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(50);
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(90);
        const event = getSampleRotateEvent({ target: node, phase: 'continue' });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeTo', {
          nodeId: 'test-node',
          angle: 75, // initialNodeAngle (30) + angleDelta (90 - 45)
        });
      });
    });

    describe('end phase', () => {
      it('should clear rotation state', () => {
        const event = getSampleRotateEvent({ target: node, phase: 'end' });

        instance.handle(event);

        expect(mockActionStateManager.clearRotation).toHaveBeenCalled();
      });
    });
  });
});
