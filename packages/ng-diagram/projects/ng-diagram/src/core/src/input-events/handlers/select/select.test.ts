import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockEnvironment, mockNode } from '../../../test-utils';
import { SelectEvent } from './select.event';
import { SelectEventHandler } from './select.handler';

function getSampleSelectEvent(overrides: Partial<SelectEvent> = {}): SelectEvent {
  return {
    name: 'select',
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
    lastInputPoint: { x: 0, y: 0 },
    ...overrides,
  };
}

describe('SelectEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  const mockShortcutManager = { matchesAction: vi.fn() };
  let mockFlowCore: FlowCore;
  let handler: SelectEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      shortcutManager: mockShortcutManager,
    } as unknown as FlowCore;

    mockShortcutManager.matchesAction.mockReturnValue(false);

    handler = new SelectEventHandler(mockFlowCore);
  });

  describe('phase: end', () => {
    it('should emit selectEnd command', () => {
      const event = getSampleSelectEvent({ phase: 'end' });

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('selectEnd');
      expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
    });

    it('should not run selection logic when target is present', () => {
      const node = { ...mockNode, id: 'node1', selected: false };
      const event = getSampleSelectEvent({
        phase: 'end',
        target: node,
        targetType: 'node',
      });

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('selectEnd');
      expect(mockCommandHandler.emit).not.toHaveBeenCalledWith('select', expect.anything());
    });
  });

  describe('phase: start (or undefined)', () => {
    it('should run selection logic when phase is undefined', () => {
      const node = { ...mockNode, id: 'node1', selected: false };
      const event = getSampleSelectEvent({
        target: node,
        targetType: 'node',
      });

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
        nodeIds: ['node1'],
        edgeIds: undefined,
        multiSelection: false,
      });
    });

    describe('when clicking on diagram background', () => {
      it('should emit deselectAll when no modifier is pressed', () => {
        const event = getSampleSelectEvent({
          phase: 'start',
          targetType: 'diagram',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselectAll');
      });

      it('should not emit any command when modifier is pressed', () => {
        mockShortcutManager.matchesAction.mockReturnValue(true);
        const event = getSampleSelectEvent({
          phase: 'start',
          targetType: 'diagram',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });

    describe('when clicking on a node', () => {
      it('should select node when clicking on unselected node without modifier', () => {
        const event = getSampleSelectEvent({
          phase: 'start',
          target: mockNode,
          targetType: 'node',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: [mockNode.id],
          edgeIds: undefined,
          multiSelection: false,
        });
      });

      it('should select node with multiSelection when modifier is pressed', () => {
        mockShortcutManager.matchesAction.mockReturnValue(true);
        const event = getSampleSelectEvent({
          phase: 'start',
          target: mockNode,
          targetType: 'node',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: [mockNode.id],
          edgeIds: undefined,
          multiSelection: true,
        });
      });

      it('should preserve selection when clicking on already selected node without modifier', () => {
        const selectedNode = { ...mockNode, selected: true };
        const event = getSampleSelectEvent({
          phase: 'start',
          target: selectedNode,
          targetType: 'node',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: [selectedNode.id],
          edgeIds: undefined,
          multiSelection: true,
        });
      });

      it('should deselect node when clicking on selected node with modifier', () => {
        mockShortcutManager.matchesAction.mockReturnValue(true);
        const selectedNode = { ...mockNode, selected: true };
        const event = getSampleSelectEvent({
          phase: 'start',
          target: selectedNode,
          targetType: 'node',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
          nodeIds: [selectedNode.id],
          edgeIds: undefined,
        });
      });
    });

    describe('when clicking on an edge', () => {
      it('should select edge when clicking on unselected edge without modifier', () => {
        const event = getSampleSelectEvent({
          phase: 'start',
          target: mockEdge,
          targetType: 'edge',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: undefined,
          edgeIds: [mockEdge.id],
          multiSelection: false,
        });
      });

      it('should select edge with multiSelection when modifier is pressed', () => {
        mockShortcutManager.matchesAction.mockReturnValue(true);
        const event = getSampleSelectEvent({
          phase: 'start',
          target: mockEdge,
          targetType: 'edge',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: undefined,
          edgeIds: [mockEdge.id],
          multiSelection: true,
        });
      });

      it('should preserve selection when clicking on already selected edge without modifier', () => {
        const selectedEdge = { ...mockEdge, selected: true };
        const event = getSampleSelectEvent({
          phase: 'start',
          target: selectedEdge,
          targetType: 'edge',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: undefined,
          edgeIds: [selectedEdge.id],
          multiSelection: true,
        });
      });

      it('should deselect edge when clicking on selected edge with modifier', () => {
        mockShortcutManager.matchesAction.mockReturnValue(true);
        const selectedEdge = { ...mockEdge, selected: true };
        const event = getSampleSelectEvent({
          phase: 'start',
          target: selectedEdge,
          targetType: 'edge',
        });

        handler.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
          nodeIds: undefined,
          edgeIds: [selectedEdge.id],
        });
      });
    });
  });
});
