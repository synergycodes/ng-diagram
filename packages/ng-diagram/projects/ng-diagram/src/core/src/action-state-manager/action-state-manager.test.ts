import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventManager } from '../event-manager/event-manager';
import type { ActionStateChangedEvent } from '../event-manager/internal-event-types';
import { ActionStateManager } from './action-state-manager';

describe('ActionStateManager', () => {
  let actionStateManager: ActionStateManager;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    eventManager = new EventManager();
    emitSpy = vi.spyOn(eventManager, 'emit');
    actionStateManager = new ActionStateManager(eventManager);
  });

  describe('getState()', () => {
    it('should return the current state', () => {
      const state = actionStateManager.getState();
      expect(state).toEqual({});
    });

    it('should return readonly state', () => {
      const state = actionStateManager.getState();
      expect(Object.isFrozen(state)).toBe(false); // Proxy doesn't freeze, but type is readonly
    });
  });

  describe('resize state', () => {
    it('should set and get resize state', () => {
      const resizeState = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      actionStateManager.resize = resizeState;

      expect(actionStateManager.resize).toEqual(resizeState);
      expect(actionStateManager.isResizing()).toBe(true);
    });

    it('should emit actionStateChanged when resize is set', () => {
      const resizeState = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      actionStateManager.resize = resizeState;

      expect(emitSpy).toHaveBeenCalledWith('actionStateChanged', {
        actionState: { resize: resizeState },
      });
    });

    it('should clear resize state', () => {
      actionStateManager.resize = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      actionStateManager.clearResize();

      expect(actionStateManager.resize).toBeUndefined();
      expect(actionStateManager.isResizing()).toBe(false);
    });

    it('should emit actionStateChanged when resize is cleared', () => {
      actionStateManager.resize = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      emitSpy.mockClear();

      actionStateManager.clearResize();

      expect(emitSpy).toHaveBeenCalledWith('actionStateChanged', {
        actionState: { resize: undefined },
      });
    });
  });

  describe('linking state', () => {
    it('should set and get linking state', () => {
      const linkingState = { sourceNodeId: 'n1', sourcePortId: 'p1', temporaryEdge: null };
      actionStateManager.linking = linkingState;

      expect(actionStateManager.linking).toEqual(linkingState);
      expect(actionStateManager.isLinking()).toBe(true);
    });

    it('should emit actionStateChanged when linking is set', () => {
      const linkingState = { sourceNodeId: 'n1', sourcePortId: 'p1', temporaryEdge: null };
      actionStateManager.linking = linkingState;

      expect(emitSpy).toHaveBeenCalledWith('actionStateChanged', {
        actionState: { linking: linkingState },
      });
    });

    it('should clear linking state', () => {
      actionStateManager.linking = { sourceNodeId: 'n1', sourcePortId: 'p1', temporaryEdge: null };
      actionStateManager.clearLinking();

      expect(actionStateManager.linking).toBeUndefined();
      expect(actionStateManager.isLinking()).toBe(false);
    });
  });

  describe('rotation state', () => {
    it('should set and get rotation state', () => {
      const rotationState = { startAngle: 45, initialNodeAngle: 0, nodeId: 'n1' };
      actionStateManager.rotation = rotationState;

      expect(actionStateManager.rotation).toEqual(rotationState);
      expect(actionStateManager.isRotating()).toBe(true);
    });

    it('should emit actionStateChanged when rotation is set', () => {
      const rotationState = { startAngle: 45, initialNodeAngle: 0, nodeId: 'n1' };
      actionStateManager.rotation = rotationState;

      expect(emitSpy).toHaveBeenCalledWith('actionStateChanged', {
        actionState: { rotation: rotationState },
      });
    });

    it('should clear rotation state', () => {
      actionStateManager.rotation = { startAngle: 45, initialNodeAngle: 0, nodeId: 'n1' };
      actionStateManager.clearRotation();

      expect(actionStateManager.rotation).toBeUndefined();
      expect(actionStateManager.isRotating()).toBe(false);
    });
  });

  describe('dragging state', () => {
    it('should set and get dragging state', () => {
      const draggingState = { modifiers: { primary: false, secondary: false, shift: false, meta: false } };
      actionStateManager.dragging = draggingState;

      expect(actionStateManager.dragging).toEqual(draggingState);
      expect(actionStateManager.isDragging()).toBe(true);
    });

    it('should emit actionStateChanged when dragging is set', () => {
      const draggingState = { modifiers: { primary: false, secondary: false, shift: false, meta: false } };
      actionStateManager.dragging = draggingState;

      expect(emitSpy).toHaveBeenCalledWith('actionStateChanged', {
        actionState: { dragging: draggingState },
      });
    });

    it('should clear dragging state', () => {
      actionStateManager.dragging = { modifiers: { primary: false, secondary: false, shift: false, meta: false } };
      actionStateManager.clearDragging();

      expect(actionStateManager.dragging).toBeUndefined();
      expect(actionStateManager.isDragging()).toBe(false);
    });
  });

  describe('copyPaste state', () => {
    it('should set and get copyPaste state', () => {
      const copyPasteState = {
        copiedNodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: {} }],
        copiedEdges: [{ id: 'e1', source: 'n1', target: 'n2', data: {} }],
      };
      actionStateManager.copyPaste = copyPasteState;

      expect(actionStateManager.copyPaste).toEqual(copyPasteState);
    });

    it('should emit actionStateChanged when copyPaste is set', () => {
      const copyPasteState = {
        copiedNodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: {} }],
        copiedEdges: [{ id: 'e1', source: 'n1', target: 'n2', data: {} }],
      };
      actionStateManager.copyPaste = copyPasteState;

      expect(emitSpy).toHaveBeenCalledWith('actionStateChanged', {
        actionState: { copyPaste: copyPasteState },
      });
    });

    it('should clear copyPaste state', () => {
      actionStateManager.copyPaste = {
        copiedNodes: [{ id: 'n1', position: { x: 0, y: 0 }, data: {} }],
        copiedEdges: [{ id: 'e1', source: 'n1', target: 'n2', data: {} }],
      };
      actionStateManager.clearCopyPaste();

      expect(actionStateManager.copyPaste).toBeUndefined();
    });
  });

  describe('highlightGroup state', () => {
    it('should set and get highlightGroup state', () => {
      const highlightGroupState = { highlightedGroupId: 'g1' };
      actionStateManager.highlightGroup = highlightGroupState;

      expect(actionStateManager.highlightGroup).toEqual(highlightGroupState);
    });

    it('should emit actionStateChanged when highlightGroup is set', () => {
      const highlightGroupState = { highlightedGroupId: 'g1' };
      actionStateManager.highlightGroup = highlightGroupState;

      expect(emitSpy).toHaveBeenCalledWith('actionStateChanged', {
        actionState: { highlightGroup: highlightGroupState },
      });
    });

    it('should clear highlightGroup state', () => {
      actionStateManager.highlightGroup = { highlightedGroupId: 'g1' };
      actionStateManager.clearHighlightGroup();

      expect(actionStateManager.highlightGroup).toBeUndefined();
    });
  });

  describe('multiple state changes', () => {
    it('should handle multiple simultaneous states', () => {
      const resizeState = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      const linkingState = { sourceNodeId: 'n2', sourcePortId: 'p1', temporaryEdge: null };

      actionStateManager.resize = resizeState;
      actionStateManager.linking = linkingState;

      const state = actionStateManager.getState();
      expect(state.resize).toEqual(resizeState);
      expect(state.linking).toEqual(linkingState);
      expect(actionStateManager.isResizing()).toBe(true);
      expect(actionStateManager.isLinking()).toBe(true);
    });

    it('should emit separate events for each state change', () => {
      const resizeState = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      const linkingState = { sourceNodeId: 'n2', sourcePortId: 'p1', temporaryEdge: null };

      actionStateManager.resize = resizeState;
      actionStateManager.linking = linkingState;

      expect(emitSpy).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenNthCalledWith(1, 'actionStateChanged', {
        actionState: { resize: resizeState },
      });
      expect(emitSpy).toHaveBeenNthCalledWith(2, 'actionStateChanged', {
        actionState: { resize: resizeState, linking: linkingState },
      });
    });
  });

  describe('event integration', () => {
    it('should allow external listeners to receive actionStateChanged events', () => {
      const callback = vi.fn();
      eventManager.on('actionStateChanged', callback);

      const resizeState = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      actionStateManager.resize = resizeState;

      expect(callback).toHaveBeenCalledWith({
        actionState: { resize: resizeState },
      } as ActionStateChangedEvent);
    });

    it('should emit fresh state copy on each change', () => {
      const callback = vi.fn();
      eventManager.on('actionStateChanged', callback);

      actionStateManager.resize = {
        startWidth: 100,
        startHeight: 100,
        startX: 0,
        startY: 0,
        startNodePositionX: 50,
        startNodePositionY: 50,
        resizingNode: { id: 'n1', position: { x: 0, y: 0 }, data: {} },
      };
      actionStateManager.linking = { sourceNodeId: 'n2', sourcePortId: 'p1', temporaryEdge: null };

      expect(callback).toHaveBeenCalledTimes(2);
      const firstCall = callback.mock.calls[0][0] as ActionStateChangedEvent;
      const secondCall = callback.mock.calls[1][0] as ActionStateChangedEvent;

      // Ensure each call gets a different object reference (fresh copy)
      expect(firstCall.actionState).not.toBe(secondCall.actionState);
    });
  });
});
