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
  let instance: SelectEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      shortcutManager: mockShortcutManager,
    } as unknown as FlowCore;

    instance = new SelectEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    describe('when clicking outside of elements', () => {
      it('should emit deselectAll command', () => {
        const event = getSampleSelectEvent({ targetType: 'diagram' });
        mockShortcutManager.matchesAction.mockReturnValue(false);

        instance.handle(event);
        expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselectAll');
      });
    });

    describe('when clicking on a node', () => {
      beforeEach(() => {
        (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
          nodes: [mockNode],
          edges: [],
        });
      });

      it('should select node when clicking on unselected node without modifier', () => {
        const event = getSampleSelectEvent({
          target: mockNode,
          targetType: 'node',
          modifiers: {
            primary: false,
            secondary: false,
            shift: false,
            meta: false,
          },
        });
        mockShortcutManager.matchesAction.mockReturnValue(false);

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: [mockNode.id],
          edgeIds: undefined,
          multiSelection: false,
        });
        expect(mockShortcutManager.matchesAction).toHaveBeenCalledWith('multiSelection', {
          modifiers: event.modifiers,
        });
      });

      it('should preserve selection when clicking on already selected node without modifier', () => {
        const selectedNode = { ...mockNode, selected: true };
        (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
          nodes: [selectedNode],
          edges: [],
        });

        const event = getSampleSelectEvent({
          target: selectedNode,
          targetType: 'node',
          modifiers: {
            primary: false,
            secondary: false,
            shift: false,
            meta: false,
          },
        });
        mockShortcutManager.matchesAction.mockReturnValue(false);

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: [selectedNode.id],
          edgeIds: undefined,
          multiSelection: true,
        });
        expect(mockShortcutManager.matchesAction).toHaveBeenCalledWith('multiSelection', {
          modifiers: event.modifiers,
        });
      });

      it('should deselect node when clicking on selected node with modifier', () => {
        const selectedNode = { ...mockNode, selected: true };
        (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
          nodes: [selectedNode],
          edges: [],
        });

        const event = getSampleSelectEvent({
          target: selectedNode,
          targetType: 'node',
          modifiers: {
            primary: true,
            secondary: false,
            shift: false,
            meta: false,
          },
        });
        mockShortcutManager.matchesAction.mockReturnValue(true);

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
          nodeIds: [selectedNode.id],
          edgeIds: undefined,
        });
        expect(mockShortcutManager.matchesAction).toHaveBeenCalledWith('multiSelection', {
          modifiers: event.modifiers,
        });
      });
    });

    describe('when clicking on an edge', () => {
      beforeEach(() => {
        (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
          nodes: [],
          edges: [mockEdge],
        });
      });

      it('should select edge when clicking on unselected edge without modifier', () => {
        const event = getSampleSelectEvent({
          target: mockEdge,
          targetType: 'edge',
          modifiers: {
            primary: false,
            secondary: false,
            shift: false,
            meta: false,
          },
        });
        mockShortcutManager.matchesAction.mockReturnValue(false);

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: undefined,
          edgeIds: [mockEdge.id],
          multiSelection: false,
        });
        expect(mockShortcutManager.matchesAction).toHaveBeenCalledWith('multiSelection', {
          modifiers: event.modifiers,
        });
      });

      it('should preserve selection when clicking on already selected edge without modifier', () => {
        const selectedEdge = { ...mockEdge, selected: true };
        (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
          nodes: [],
          edges: [selectedEdge],
        });

        const event = getSampleSelectEvent({
          target: selectedEdge,
          targetType: 'edge',
          modifiers: {
            primary: false,
            secondary: false,
            shift: false,
            meta: false,
          },
        });
        mockShortcutManager.matchesAction.mockReturnValue(false);

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: undefined,
          edgeIds: [selectedEdge.id],
          multiSelection: true,
        });
        expect(mockShortcutManager.matchesAction).toHaveBeenCalledWith('multiSelection', {
          modifiers: event.modifiers,
        });
      });

      it('should deselect edge when clicking on selected edge with modifier', () => {
        const selectedEdge = { ...mockEdge, selected: true };
        (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
          nodes: [],
          edges: [selectedEdge],
        });

        const event = getSampleSelectEvent({
          target: selectedEdge,
          targetType: 'edge',
          modifiers: {
            primary: true,
            secondary: false,
            shift: false,
            meta: false,
          },
        });
        mockShortcutManager.matchesAction.mockReturnValue(true);

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
          nodeIds: undefined,
          edgeIds: [selectedEdge.id],
        });
        expect(mockShortcutManager.matchesAction).toHaveBeenCalledWith('multiSelection', {
          modifiers: event.modifiers,
        });
      });
    });

    describe('platform specific behavior', () => {
      it('should use primary modifier (abstracted from platform specifics)', () => {
        const selectedNode = { ...mockNode, selected: true };
        (mockFlowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
          nodes: [selectedNode],
          edges: [],
        });

        const event = getSampleSelectEvent({
          target: selectedNode,
          targetType: 'node',
          modifiers: {
            primary: true, // This represents metaKey on MacOS or ctrlKey on other platforms
            secondary: false,
            shift: false,
            meta: false,
          },
        });
        mockShortcutManager.matchesAction.mockReturnValue(true);

        instance.handle(event);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
          nodeIds: [selectedNode.id],
          edgeIds: undefined,
        });
        expect(mockShortcutManager.matchesAction).toHaveBeenCalledWith('multiSelection', {
          modifiers: event.modifiers,
        });
      });
    });
  });
});
