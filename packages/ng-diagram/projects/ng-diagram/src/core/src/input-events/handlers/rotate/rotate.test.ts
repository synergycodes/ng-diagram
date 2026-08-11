import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { NgDiagramMath } from '../../../math';
import { macrotask, mockNode } from '../../../test-utils';
import { RotationActionState } from '../../../types';
import { RotateInputEvent } from './rotate.event';
import { MIN_DISTANCE_TO_CENTER, RotateEventHandler } from './rotate.handler';

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

const INITIAL_NODE_ANGLE = 30;
/** Mocked angleBetweenPoints at gesture start — becomes the state's startAngle. */
const START_ANGLE = 45;
/** Mocked angleBetweenPoints at the asserted move/release point. */
const RELEASE_ANGLE = 90;
const EXPECTED_ANGLE = INITIAL_NODE_ANGLE + (RELEASE_ANGLE - START_ANGLE);

const activeRotation = (): RotationActionState => ({
  startAngle: START_ANGLE,
  initialNodeAngle: INITIAL_NODE_ANGLE,
  nodeId: 'test-node',
});

describe('RotateEventHandler', () => {
  let flowCore: FlowCore;
  let mockCommandHandler: { emit: ReturnType<typeof vi.fn> };
  let mockActionStateManager: { rotation: RotationActionState | undefined; clearRotation: ReturnType<typeof vi.fn> };
  let instance: RotateEventHandler;

  const node = { ...mockNode, id: 'test-node', angle: INITIAL_NODE_ANGLE };

  beforeEach(() => {
    mockCommandHandler = { emit: vi.fn() };
    mockActionStateManager = {
      rotation: undefined,
      clearRotation: vi.fn(),
    };
    flowCore = {
      commandHandler: mockCommandHandler,
      isCancellingInteraction: () => false,
      actionStateManager: mockActionStateManager,
      clientToFlowPosition: vi.fn().mockImplementation((point) => point),
      getNodeById: vi.fn().mockReturnValue(node),
      transaction: vi.fn().mockImplementation(async (_name, callback) => {
        const txContext = { emit: mockCommandHandler.emit };
        return await callback(txContext);
      }),
    } as unknown as FlowCore;
    instance = new RotateEventHandler(flowCore);
    vi.clearAllMocks();
  });

  describe('re-entrancy under async command emits', () => {
    it('should not clear a newly started rotation while the previous stop emit is suspended', async () => {
      vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(START_ANGLE);
      mockCommandHandler.emit.mockImplementation(async (name: string) => {
        if (name === 'rotateNodeStop') {
          await macrotask();
        }
      });

      await instance.handle(getSampleRotateEvent({ target: node, phase: 'start' }));
      const endPromise = instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }));

      // A new rotation starts while the previous end is suspended on rotateNodeStop
      await instance.handle(getSampleRotateEvent({ target: node, phase: 'start' }));
      const newState = mockActionStateManager.rotation;
      expect(newState).toBeDefined();

      await endPromise;

      expect(mockActionStateManager.clearRotation).not.toHaveBeenCalled();
      expect(mockActionStateManager.rotation).toBe(newState);
    });

    it('should clear the rotation state even when the stop emit rejects', async () => {
      vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(START_ANGLE);
      mockCommandHandler.emit.mockImplementation(async (name: string) => {
        if (name === 'rotateNodeStop') {
          throw new Error('middleware failed');
        }
      });

      await instance.handle(getSampleRotateEvent({ target: node, phase: 'start' }));
      await expect(instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }))).rejects.toThrow(
        'middleware failed'
      );

      expect(mockActionStateManager.clearRotation).toHaveBeenCalled();
    });

    it('should clear the rotation state when no new gesture started during the stop emit', async () => {
      vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(START_ANGLE);
      mockCommandHandler.emit.mockImplementation(async (name: string) => {
        if (name === 'rotateNodeStop') {
          await macrotask();
        }
      });

      await instance.handle(getSampleRotateEvent({ target: node, phase: 'start' }));
      await instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }));

      expect(mockActionStateManager.clearRotation).toHaveBeenCalled();
    });
  });

  describe('handle', () => {
    describe('start phase', () => {
      it('should initialize rotation state', () => {
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(START_ANGLE);
        const event = getSampleRotateEvent({ target: node, phase: 'start' });

        instance.handle(event);

        expect(mockActionStateManager.rotation).toEqual(activeRotation());
      });
    });

    describe('continue phase', () => {
      it('should not emit if mouse is too close to center', () => {
        mockActionStateManager.rotation = activeRotation();
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(MIN_DISTANCE_TO_CENTER - 20);
        const event = getSampleRotateEvent({ target: node, phase: 'continue' });

        instance.handle(event);
        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });

      it('should emit rotateNodeTo with correct params if distance is sufficient', () => {
        mockActionStateManager.rotation = activeRotation();
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(MIN_DISTANCE_TO_CENTER + 20);
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(RELEASE_ANGLE);
        const event = getSampleRotateEvent({ target: node, phase: 'continue' });

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeTo', {
          nodeId: 'test-node',
          angle: EXPECTED_ANGLE,
        });
      });
    });

    describe('end phase', () => {
      it('should clear rotation state', async () => {
        const event = getSampleRotateEvent({ target: node, phase: 'end' });

        await instance.handle(event);

        expect(mockActionStateManager.clearRotation).toHaveBeenCalled();
      });

      it('should apply the release point as the final rotation before rotateNodeStop', async () => {
        mockActionStateManager.rotation = activeRotation();
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(MIN_DISTANCE_TO_CENTER + 20);
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(RELEASE_ANGLE);
        const callOrder: string[] = [];
        mockCommandHandler.emit.mockImplementation((command: string) => {
          callOrder.push(command);
          return Promise.resolve();
        });

        await instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }));

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeTo', {
          nodeId: 'test-node',
          angle: EXPECTED_ANGLE,
        });
        expect(callOrder).toEqual(['rotateNodeTo', 'rotateNodeStop']);
      });

      it('should not apply a final rotation when the release point is inside the center dead zone', async () => {
        mockActionStateManager.rotation = activeRotation();
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(MIN_DISTANCE_TO_CENTER - 20);

        await instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }));

        expect(mockCommandHandler.emit.mock.calls.some((call) => call[0] === 'rotateNodeTo')).toBe(false);
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeStop', { nodeId: 'test-node' });
      });

      it('should not apply a final rotation when the rotation state belongs to another node', async () => {
        mockActionStateManager.rotation = { ...activeRotation(), nodeId: 'other-node' };
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(MIN_DISTANCE_TO_CENTER + 20);
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(RELEASE_ANGLE);

        await instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }));

        expect(mockCommandHandler.emit.mock.calls.some((call) => call[0] === 'rotateNodeTo')).toBe(false);
      });

      it('should still emit rotateNodeStop and clear the state when the final rotation emit rejects', async () => {
        mockActionStateManager.rotation = activeRotation();
        vi.mocked(NgDiagramMath.distanceBetweenPoints).mockReturnValue(MIN_DISTANCE_TO_CENTER + 20);
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(RELEASE_ANGLE);
        mockCommandHandler.emit.mockImplementation(async (name: string) => {
          if (name === 'rotateNodeTo') {
            throw new Error('middleware failed');
          }
        });

        await expect(instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }))).rejects.toThrow(
          'middleware failed'
        );

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeStop', { nodeId: 'test-node' });
        expect(mockActionStateManager.clearRotation).toHaveBeenCalled();
      });
    });

    describe('rotateNodeStart and rotateNodeStop lifecycle events', () => {
      it('should emit rotateNodeStart command on start phase when node exists', async () => {
        vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(START_ANGLE);
        const event = getSampleRotateEvent({ target: node, phase: 'start' });

        await instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeStart', { nodeId: expect.any(String) });
      });

      it('should NOT emit rotateNodeStart when node does not exist', async () => {
        vi.mocked(flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
        const event = getSampleRotateEvent({ target: node, phase: 'start' });

        await instance.handle(event);

        expect(mockCommandHandler.emit.mock.calls.some((call) => call[0] === 'rotateNodeStart')).toBe(false);
      });

      it('should emit rotateNodeStop command on end phase', async () => {
        const event = getSampleRotateEvent({ target: node, phase: 'end' });

        await instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeStop', { nodeId: undefined });
      });

      it('should emit rotateNodeStop before clearRotation is called', async () => {
        const callOrder: string[] = [];
        mockCommandHandler.emit.mockImplementation((command: string) => {
          callOrder.push(command);
          return Promise.resolve();
        });
        mockActionStateManager.clearRotation.mockImplementation(() => {
          callOrder.push('clearRotation');
        });

        const event = getSampleRotateEvent({ target: node, phase: 'end' });

        await instance.handle(event);

        expect(callOrder).toEqual(['rotateNodeStop', 'clearRotation']);
      });
    });
  });

  describe('cancel', () => {
    it('should do nothing when no rotation is in progress', async () => {
      await instance.cancel();

      expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      expect(mockActionStateManager.clearRotation).not.toHaveBeenCalled();
    });

    it('should set the cancelled reason, emit rotateNodeStop and clear the state', async () => {
      const rotation = activeRotation();
      mockActionStateManager.rotation = rotation;

      await instance.cancel();

      expect(rotation.cancelReason).toBe('cancelled');
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('rotateNodeStop', { nodeId: 'test-node' });
      expect(mockActionStateManager.clearRotation).toHaveBeenCalled();
    });

    it('should restore the pre-rotation angle', async () => {
      const rotation = activeRotation();
      mockActionStateManager.rotation = rotation;

      await instance.cancel();

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('updateNode', {
        id: 'test-node',
        nodeChanges: { angle: INITIAL_NODE_ANGLE },
      });
      const calls = mockCommandHandler.emit.mock.calls.map(([name]) => name);
      expect(calls.indexOf('updateNode')).toBeLessThan(calls.indexOf('rotateNodeStop'));
    });

    it('should roll back inside a cancelRotate transaction', async () => {
      mockActionStateManager.rotation = activeRotation();

      await instance.cancel();

      expect(flowCore.transaction).toHaveBeenCalledWith('cancelRotate', expect.any(Function));
    });

    it('should refuse to cancel while the normal end phase is in flight', async () => {
      let releaseStop: () => void = () => undefined;
      mockCommandHandler.emit.mockImplementation(async (name: string) => {
        if (name === 'rotateNodeStop') {
          await new Promise<void>((resolve) => {
            releaseStop = resolve;
          });
        }
      });

      mockActionStateManager.rotation = activeRotation();
      const endPromise = instance.handle(getSampleRotateEvent({ target: node, phase: 'end' }));

      await expect(instance.cancel()).resolves.toBe(false);

      // The completed gesture is left to its end phase: no rollback, no cancel stamp
      expect(mockActionStateManager.rotation?.cancelReason).toBeUndefined();
      expect(flowCore.transaction).not.toHaveBeenCalledWith('cancelRotate', expect.any(Function));

      releaseStop();
      await endPromise;
    });

    it('should not clear a rotation that started while the cancel rollback was suspended', async () => {
      vi.mocked(NgDiagramMath.angleBetweenPoints).mockReturnValue(START_ANGLE);
      mockCommandHandler.emit.mockImplementation(async (name: string) => {
        if (name === 'rotateNodeStop') {
          await macrotask();
        }
      });

      mockActionStateManager.rotation = activeRotation();
      const cancelPromise = instance.cancel();

      // A new rotation starts while the cancel rollback is suspended on rotateNodeStop
      await instance.handle(getSampleRotateEvent({ target: node, phase: 'start' }));
      const newState = mockActionStateManager.rotation;
      expect(newState).toBeDefined();

      await cancelPromise;

      expect(mockActionStateManager.clearRotation).not.toHaveBeenCalled();
      expect(mockActionStateManager.rotation).toBe(newState);
    });
  });
});
