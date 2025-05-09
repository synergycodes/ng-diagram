import { CommandHandler, EnvironmentInfo, FlowCore, InputEventHandler, KeyboardEvent } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockedNode, mockedPointerEvent } from '../../test-utils';
import { linkingAction } from '../linking';

describe('linkingAction', () => {
  const environment: EnvironmentInfo = { os: 'Windows', browser: 'Chrome' };
  let mockCommandHandler: CommandHandler;
  let mockInputEventHandler: InputEventHandler;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = {} as FlowCore;
    mockCommandHandler = {
      emit: vi.fn(),
      flowCore: mockFlowCore,
    } as unknown as CommandHandler;
    mockInputEventHandler = {
      commandHandler: mockCommandHandler,
    } as unknown as InputEventHandler;

    // Clean isLinking flag before each test
    linkingAction.action({ ...mockedPointerEvent, type: 'pointerup', button: 2 }, mockInputEventHandler, environment);
  });

  describe('predicate', () => {
    it('should return false for wrong event type events', () => {
      const keyboardEvent = {
        type: 'keydown',
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
      } as KeyboardEvent;
      expect(linkingAction.predicate(keyboardEvent, mockInputEventHandler, environment)).toBe(false);
    });

    it('should return false if pointer down event and button is not 2', () => {
      expect(
        linkingAction.predicate(
          { ...mockedPointerEvent, type: 'pointerdown', button: 1 },
          mockInputEventHandler,
          environment
        )
      ).toBe(false);
    });

    it('should return true if pointer down event and button is 2', () => {
      expect(
        linkingAction.predicate(
          { ...mockedPointerEvent, type: 'pointerdown', button: 2 },
          mockInputEventHandler,
          environment
        )
      ).toBe(true);
    });

    it('should return true if pointer move event', () => {
      expect(
        linkingAction.predicate({ ...mockedPointerEvent, type: 'pointermove' }, mockInputEventHandler, environment)
      ).toBe(true);
    });

    it('should return false if pointer up event and button is not 2 ', () => {
      expect(
        linkingAction.predicate(
          { ...mockedPointerEvent, type: 'pointerup', button: 1 },
          mockInputEventHandler,
          environment
        )
      ).toBe(false);
    });

    it('should return true if pointer up event and button is 2', () => {
      expect(
        linkingAction.predicate(
          { ...mockedPointerEvent, type: 'pointerup', button: 2 },
          mockInputEventHandler,
          environment
        )
      ).toBe(true);
    });
  });

  describe('action', () => {
    it('should call startLinking if pointer down event and target is a node', () => {
      linkingAction.action(
        { ...mockedPointerEvent, type: 'pointerdown', target: { type: 'node', element: mockedNode }, button: 2 },
        mockInputEventHandler,
        environment
      );
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('startLinking', { source: mockedNode.id });
    });

    it('should call startLinkingFromPosition if pointer down event and target is not a node', () => {
      linkingAction.action(
        { ...mockedPointerEvent, type: 'pointerdown', target: { type: 'diagram' }, button: 2 },
        mockInputEventHandler,
        environment
      );

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('startLinkingFromPosition', {
        position: { x: mockedPointerEvent.x, y: mockedPointerEvent.y },
      });
    });

    it('should not call moveTemporaryEdge if pointer move event and linking not started', () => {
      linkingAction.action({ ...mockedPointerEvent, type: 'pointermove' }, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveTemporaryEdge');
    });

    it('should call moveTemporaryEdge if pointer move event and linking started', () => {
      linkingAction.action(
        { ...mockedPointerEvent, type: 'pointerdown', button: 2 },
        mockInputEventHandler,
        environment
      );
      linkingAction.action({ ...mockedPointerEvent, type: 'pointermove' }, mockInputEventHandler, environment);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
        position: { x: mockedPointerEvent.x, y: mockedPointerEvent.y },
      });
    });

    it('should call finishLinking if pointer up event and target is a node', () => {
      linkingAction.action(
        { ...mockedPointerEvent, type: 'pointerdown', button: 2 },
        mockInputEventHandler,
        environment
      );
      linkingAction.action(
        { ...mockedPointerEvent, type: 'pointerup', target: { type: 'node', element: mockedNode }, button: 2 },
        mockInputEventHandler,
        environment
      );

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinking', { target: mockedNode.id });
    });

    it('should call finishLinkingToPosition if pointer up event and target is not a node', () => {
      linkingAction.action(
        { ...mockedPointerEvent, type: 'pointerdown', button: 2 },
        mockInputEventHandler,
        environment
      );
      linkingAction.action(
        { ...mockedPointerEvent, type: 'pointerup', target: { type: 'diagram' }, button: 2 },
        mockInputEventHandler,
        environment
      );

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinkingToPosition', {
        position: { x: mockedPointerEvent.x, y: mockedPointerEvent.y },
      });
    });
  });
});
