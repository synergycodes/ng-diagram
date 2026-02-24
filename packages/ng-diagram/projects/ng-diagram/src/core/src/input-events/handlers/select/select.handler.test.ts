import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment, mockNode } from '../../../test-utils';
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
      shortcutManager: mockShortcutManager,
      environment: mockEnvironment,
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

    it('should not run selection logic', () => {
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
    it('should run selection logic when phase is start', () => {
      const node = { ...mockNode, id: 'node1', selected: false };
      const event = getSampleSelectEvent({
        phase: 'start',
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

    it('should run selection logic when phase is undefined (backward compat)', () => {
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

    it('should deselect all when clicking diagram with no modifier', () => {
      const event = getSampleSelectEvent({
        phase: 'start',
        targetType: 'diagram',
      });

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselectAll');
    });

    it('should deselect target when modifier is pressed and target is already selected', () => {
      mockShortcutManager.matchesAction.mockReturnValue(true);
      const node = { ...mockNode, id: 'node1', selected: true };
      const event = getSampleSelectEvent({
        phase: 'start',
        target: node,
        targetType: 'node',
      });

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('deselect', {
        nodeIds: ['node1'],
        edgeIds: undefined,
      });
    });

    it('should select edge when clicking an edge', () => {
      const event = getSampleSelectEvent({
        phase: 'start',
        target: { id: 'edge1', selected: false } as SelectEvent['target'],
        targetType: 'edge',
      });

      handler.handle(event);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
        nodeIds: undefined,
        edgeIds: ['edge1'],
        multiSelection: false,
      });
    });
  });
});
