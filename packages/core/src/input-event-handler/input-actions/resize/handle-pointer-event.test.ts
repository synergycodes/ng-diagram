import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { getSamplePointerEvent } from '../../../test-utils';
import { Node, ResizeHandlePosition } from '../../../types';
import { handlePointerEvent } from './handle-pointer-event';

describe('handlePointerEvent', () => {
  let mockFlowCore: FlowCore;
  const mockNode: Node = {
    id: 'node1',
    type: 'node',
    position: { x: 0, y: 0 },
    size: { width: 200, height: 200 },
    data: {},
    resizable: true,
  };

  beforeEach(() => {
    mockFlowCore = {
      clientToFlowPosition: vi.fn(({ x, y }) => ({ x, y })),
      commandHandler: { emit: vi.fn() },
    } as unknown as FlowCore;
    handlePointerEvent(mockFlowCore, getSamplePointerEvent({ type: 'pointerup' }));
  });

  describe('pointerdown', () => {
    it('should do nothing when target is not a resize handle', () => {
      const pointerDownEvent = getSamplePointerEvent({ type: 'pointerdown', target: { type: 'diagram' } });
      const pointerMoveEvent = getSamplePointerEvent({ type: 'pointermove' });

      handlePointerEvent(mockFlowCore, pointerDownEvent);
      handlePointerEvent(mockFlowCore, pointerMoveEvent);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should initialize resize state when clicking resize handle', () => {
      const pointerDownEvent = getSamplePointerEvent({
        type: 'pointerdown',
        target: { type: 'resize-handle', position: 'top-left', element: mockNode },
      });
      const pointerMoveEvent = getSamplePointerEvent({ type: 'pointermove' });

      handlePointerEvent(mockFlowCore, pointerDownEvent);
      handlePointerEvent(mockFlowCore, pointerMoveEvent);

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('resizeNode', {
        id: 'node1',
        disableAutoSize: true,
        position: { x: 0, y: 0 },
        size: { width: 200, height: 200 },
      });
    });
  });

  describe('pointermove', () => {
    it('should not emit resizeNode command when is not resizing', () => {
      const pointerMoveEvent = getSamplePointerEvent({ type: 'pointermove' });

      handlePointerEvent(mockFlowCore, pointerMoveEvent);

      expect(mockFlowCore.commandHandler.emit).not.toHaveBeenCalled();
    });

    describe.each<{
      position: ResizeHandlePosition;
      startPosition: { x: number; y: number };
      pointerMove: { x: number; y: number };
      expectedPosition: { x: number; y: number };
      expectedSize: { width: number; height: number };
    }>([
      {
        position: 'top-left',
        startPosition: { x: 0, y: 0 },
        pointerMove: { x: -1, y: -1 },
        expectedPosition: { x: -1, y: -1 },
        expectedSize: { width: 201, height: 201 },
      },
      {
        position: 'top',
        startPosition: { x: 100, y: 0 },
        pointerMove: { x: 100, y: -1 },
        expectedPosition: { x: 0, y: -1 },
        expectedSize: { width: 200, height: 201 },
      },
      {
        position: 'top-right',
        startPosition: { x: 200, y: 0 },
        pointerMove: { x: 199, y: 1 },
        expectedPosition: { x: 0, y: 1 },
        expectedSize: { width: 199, height: 199 },
      },
      {
        position: 'right',
        startPosition: { x: 200, y: 100 },
        pointerMove: { x: 201, y: 100 },
        expectedPosition: { x: 0, y: 0 },
        expectedSize: { width: 201, height: 200 },
      },
      {
        position: 'bottom-right',
        startPosition: { x: 200, y: 200 },
        pointerMove: { x: 199, y: 199 },
        expectedPosition: { x: 0, y: 0 },
        expectedSize: { width: 199, height: 199 },
      },
      {
        position: 'bottom',
        startPosition: { x: 100, y: 200 },
        pointerMove: { x: 100, y: 201 },
        expectedPosition: { x: 0, y: 0 },
        expectedSize: { width: 200, height: 201 },
      },
      {
        position: 'bottom-left',
        startPosition: { x: 0, y: 200 },
        pointerMove: { x: -1, y: 201 },
        expectedPosition: { x: -1, y: 0 },
        expectedSize: { width: 201, height: 201 },
      },
      {
        position: 'left',
        startPosition: { x: 0, y: 100 },
        pointerMove: { x: -1, y: 100 },
        expectedPosition: { x: -1, y: 0 },
        expectedSize: { width: 201, height: 200 },
      },
    ])('resize handle position: %s', ({ position, startPosition, pointerMove, expectedPosition, expectedSize }) => {
      beforeEach(() => {
        handlePointerEvent(
          mockFlowCore,
          getSamplePointerEvent({
            type: 'pointerdown',
            x: startPosition.x,
            y: startPosition.y,
            target: { type: 'resize-handle', position, element: mockNode },
          })
        );
      });

      it('should emit resizeNode command when resizing', () => {
        handlePointerEvent(
          mockFlowCore,
          getSamplePointerEvent({ type: 'pointermove', x: pointerMove.x, y: pointerMove.y })
        );

        expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('resizeNode', {
          id: 'node1',
          disableAutoSize: true,
          position: expectedPosition,
          size: expectedSize,
        });
      });
    });

    describe.each<{
      position: ResizeHandlePosition;
      startPosition: { x: number; y: number };
      pointerMove: { x: number; y: number };
      expectedPosition: { x: number; y: number };
      expectedSize: { width: number; height: number };
    }>([
      {
        position: 'top-left',
        startPosition: { x: 0, y: 0 },
        pointerMove: { x: 200, y: 200 },
        expectedPosition: { x: 150, y: 150 },
        expectedSize: { width: 50, height: 50 },
      },
      {
        position: 'top',
        startPosition: { x: 100, y: 0 },
        pointerMove: { x: 100, y: 200 },
        expectedPosition: { x: 0, y: 150 },
        expectedSize: { width: 200, height: 50 },
      },
      {
        position: 'top-right',
        startPosition: { x: 200, y: 0 },
        pointerMove: { x: 0, y: 200 },
        expectedPosition: { x: 0, y: 150 },
        expectedSize: { width: 50, height: 50 },
      },
      {
        position: 'right',
        startPosition: { x: 200, y: 100 },
        pointerMove: { x: 0, y: 100 },
        expectedPosition: { x: 0, y: 0 },
        expectedSize: { width: 50, height: 200 },
      },
      {
        position: 'bottom-right',
        startPosition: { x: 200, y: 200 },
        pointerMove: { x: 0, y: 0 },
        expectedPosition: { x: 0, y: 0 },
        expectedSize: { width: 50, height: 50 },
      },
      {
        position: 'bottom',
        startPosition: { x: 100, y: 200 },
        pointerMove: { x: 100, y: 0 },
        expectedPosition: { x: 0, y: 0 },
        expectedSize: { width: 200, height: 50 },
      },
      {
        position: 'bottom-left',
        startPosition: { x: 0, y: 200 },
        pointerMove: { x: 200, y: 0 },
        expectedPosition: { x: 150, y: 0 },
        expectedSize: { width: 50, height: 50 },
      },
      {
        position: 'left',
        startPosition: { x: 0, y: 100 },
        pointerMove: { x: 200, y: 100 },
        expectedPosition: { x: 150, y: 0 },
        expectedSize: { width: 50, height: 200 },
      },
    ])('resize handle position: %s', ({ position, startPosition, pointerMove, expectedPosition, expectedSize }) => {
      beforeEach(() => {
        handlePointerEvent(
          mockFlowCore,
          getSamplePointerEvent({
            type: 'pointerdown',
            x: startPosition.x,
            y: startPosition.y,
            target: { type: 'resize-handle', position, element: mockNode },
          })
        );
      });

      it('should not make node smaller than min size', () => {
        handlePointerEvent(
          mockFlowCore,
          getSamplePointerEvent({ type: 'pointermove', x: pointerMove.x, y: pointerMove.y })
        );

        expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('resizeNode', {
          id: 'node1',
          disableAutoSize: true,
          position: expectedPosition,
          size: expectedSize,
        });
      });
    });
  });

  describe('pointerup', () => {
    beforeEach(() => {
      handlePointerEvent(
        mockFlowCore,
        getSamplePointerEvent({
          type: 'pointerdown',
          target: { type: 'resize-handle', position: 'top-left', element: mockNode },
        })
      );
    });

    it('should reset resize state', () => {
      handlePointerEvent(mockFlowCore, getSamplePointerEvent({ type: 'pointermove' }));

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledTimes(1);

      handlePointerEvent(mockFlowCore, getSamplePointerEvent({ type: 'pointerup' }));
      handlePointerEvent(mockFlowCore, getSamplePointerEvent({ type: 'pointermove' }));

      expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledTimes(1);
    });
  });
});
