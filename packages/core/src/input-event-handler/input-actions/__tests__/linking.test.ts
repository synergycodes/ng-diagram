import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode, mockPointerEvent } from '../../../test-utils';
import type { KeyboardEvent } from '../../../types';
import { linkingAction } from '../linking';

describe('linkingAction', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      clientToFlowPosition: vi.fn().mockImplementation((args) => args),
      flowToClientPosition: vi.fn().mockImplementation((args) => args),
    } as unknown as FlowCore;

    // Clean isLinking flag before each test
    linkingAction.action({ ...mockPointerEvent, type: 'pointerup', button: 2 }, mockFlowCore);
    vi.clearAllMocks();
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
      expect(linkingAction.predicate(keyboardEvent, mockFlowCore)).toBe(false);
    });

    it('should return false if pointer down event and button is not 2', () => {
      expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointerdown', button: 1 }, mockFlowCore)).toBe(
        false
      );
    });

    it('should return true if pointer down event and button is 2', () => {
      expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointerdown', button: 2 }, mockFlowCore)).toBe(true);
    });

    it('should return true if pointer move event', () => {
      expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore)).toBe(true);
    });

    it('should return false if pointer up event and button is not 2 ', () => {
      expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointerup', button: 1 }, mockFlowCore)).toBe(false);
    });

    it('should return true if pointer up event and button is 2', () => {
      expect(linkingAction.predicate({ ...mockPointerEvent, type: 'pointerup', button: 2 }, mockFlowCore)).toBe(true);
    });
  });

  describe('action', () => {
    it('should call startLinking if pointer down event and target is a node', () => {
      linkingAction.action(
        { ...mockPointerEvent, type: 'pointerdown', target: { type: 'node', element: mockNode }, button: 2 },
        mockFlowCore
      );
      expect(mockCommandHandler.emit).toHaveBeenCalledWith('startLinking', { source: mockNode.id });
    });

    it('should call startLinkingFromPosition if pointer down event and target is not a node', () => {
      linkingAction.action(
        { ...mockPointerEvent, type: 'pointerdown', target: { type: 'diagram' }, button: 2 },
        mockFlowCore
      );

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('startLinkingFromPosition', {
        position: { x: mockPointerEvent.x, y: mockPointerEvent.y },
      });
    });

    it('should not call moveTemporaryEdge if pointer move event and linking not started', () => {
      linkingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('moveTemporaryEdge');
    });

    it('should call moveTemporaryEdge if pointer move event and linking started', () => {
      linkingAction.action({ ...mockPointerEvent, type: 'pointerdown', button: 2 }, mockFlowCore);
      linkingAction.action({ ...mockPointerEvent, type: 'pointermove' }, mockFlowCore);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('moveTemporaryEdge', {
        position: { x: mockPointerEvent.x, y: mockPointerEvent.y },
      });
    });

    it('should call finishLinking if pointer up event and target is a node', () => {
      linkingAction.action({ ...mockPointerEvent, type: 'pointerdown', button: 2 }, mockFlowCore);
      linkingAction.action(
        { ...mockPointerEvent, type: 'pointerup', target: { type: 'node', element: mockNode }, button: 2 },
        mockFlowCore
      );

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinking', { target: mockNode.id });
    });

    it('should call finishLinkingToPosition if pointer up event and target is not a node', () => {
      linkingAction.action({ ...mockPointerEvent, type: 'pointerdown', button: 2 }, mockFlowCore);
      linkingAction.action(
        { ...mockPointerEvent, type: 'pointerup', target: { type: 'diagram' }, button: 2 },
        mockFlowCore
      );

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('finishLinkingToPosition', {
        position: { x: mockPointerEvent.x, y: mockPointerEvent.y },
      });
    });
  });
});
