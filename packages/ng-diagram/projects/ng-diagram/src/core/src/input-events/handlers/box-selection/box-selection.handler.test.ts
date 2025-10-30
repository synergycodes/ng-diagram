import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockEnvironment } from '../../../test-utils';
import { Node } from '../../../types';
import { BoxSelectionEvent } from './box-selection.event';
import { BoxSelectionEventHandler } from './box-selection.handler';

function getSampleBoxSelectionEvent(overrides: Partial<BoxSelectionEvent> = {}): BoxSelectionEvent {
  return {
    name: 'boxSelection',
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
    phase: 'start',
    ...overrides,
  };
}

describe('BoxSelectionEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: BoxSelectionEventHandler;

  const node1: Node = {
    id: 'node1',
    type: 'node',
    selected: false,
    position: { x: 100, y: 100 },
    size: { width: 100, height: 80 },
    data: {},
  };

  const node2: Node = {
    id: 'node2',
    type: 'node',
    selected: false,
    position: { x: 300, y: 150 },
    size: { width: 120, height: 90 },
    data: {},
  };

  const node3: Node = {
    id: 'node3',
    type: 'node',
    selected: false,
    position: { x: 500, y: 300 },
    size: { width: 80, height: 60 },
    data: {},
  };

  const node4: Node = {
    id: 'node4',
    type: 'node',
    selected: false,
    position: { x: 250, y: 400 },
    size: { width: 100, height: 100 },
    data: {},
  };

  const node5: Node = {
    id: 'node5',
    type: 'node',
    selected: false,
    position: { x: 700, y: 100 },
    size: { width: 90, height: 70 },
    data: {},
  };

  const edge1 = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2' };
  const edge2 = { ...mockEdge, id: 'edge2', source: 'node2', target: 'node3' };
  const edge3 = { ...mockEdge, id: 'edge3', source: 'node3', target: 'node4' };

  const mockSpatialHash = {
    queryIds: vi.fn(),
  };

  const mockModel = {
    getEdges: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(() => ({
        nodes: [node1, node2, node3, node4, node5],
        edges: [edge1, edge2, edge3],
      })),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
      config: {
        boxSelection: {
          partialInclusion: true,
          realtime: false,
        },
      },
      spatialHash: mockSpatialHash,
      model: mockModel,
      clientToFlowPosition: vi.fn((point) => point),
    } as unknown as FlowCore;

    mockModel.getEdges.mockReturnValue([edge1, edge2, edge3]);

    instance = new BoxSelectionEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    describe('phase: start', () => {
      it('should initialize box selection with start point', () => {
        const event = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });

        instance.handle(event);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });

    describe('phase: continue', () => {
      it('should not select nodes during continue when realtime is disabled', () => {
        mockFlowCore.config.boxSelection.realtime = false;

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const continueEvent = getSampleBoxSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 250, y: 250 },
        });
        instance.handle(continueEvent);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });

      it('should select nodes during continue when realtime is enabled', () => {
        mockFlowCore.config.boxSelection.realtime = true;
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1', 'node2']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const continueEvent = getSampleBoxSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 450, y: 250 },
        });
        instance.handle(continueEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node1', 'node2'],
          edgeIds: ['edge1'],
          preserveSelection: false,
        });
      });
    });

    describe('phase: end', () => {
      it('should select all nodes within the box selection rectangle', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1', 'node2']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 450, y: 250 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node1', 'node2'],
          edgeIds: ['edge1'],
          preserveSelection: false,
        });
      });

      it('should select nodes when dragging from bottom-right to top-left', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node3', 'node4']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 600, y: 550 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 200, y: 250 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node3', 'node4'],
          edgeIds: ['edge3'],
          preserveSelection: false,
        });
      });

      it('should only select edges between selected nodes', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1', 'node3']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 600, y: 400 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node1', 'node3'],
          edgeIds: [],
          preserveSelection: false,
        });
      });

      it('should select multiple edges when multiple connected nodes are selected', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node2', 'node3', 'node4']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 200, y: 100 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 600, y: 550 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node2', 'node3', 'node4'],
          edgeIds: ['edge2', 'edge3'],
          preserveSelection: false,
        });
      });

      it('should handle empty selection when no nodes are in the box', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set());

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 0, y: 0 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 30, y: 30 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: [],
          edgeIds: [],
          preserveSelection: false,
        });
      });

      it('should handle single node selection', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node5']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 650, y: 50 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 850, y: 200 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node5'],
          edgeIds: [],
          preserveSelection: false,
        });
      });

      it('should select all nodes when box encompasses entire diagram', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1', 'node2', 'node3', 'node4', 'node5']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 0, y: 0 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 1000, y: 1000 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node1', 'node2', 'node3', 'node4', 'node5'],
          edgeIds: ['edge1', 'edge2', 'edge3'],
          preserveSelection: false,
        });
      });

      it('should not emit selection command if end is called without start', () => {
        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 450, y: 250 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });

      it('should reset state after end phase', () => {
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 250, y: 250 },
        });
        instance.handle(endEvent);

        const continueEvent = getSampleBoxSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 300, y: 300 },
        });
        instance.handle(continueEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);
      });
    });

    describe('partialInclusion setting', () => {
      it('should respect partialInclusion: true', () => {
        mockFlowCore.config.boxSelection.partialInclusion = true;
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1', 'node2']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 350, y: 200 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalledWith('select', {
          nodeIds: ['node1', 'node2'],
          edgeIds: ['edge1'],
          preserveSelection: false,
        });
      });

      it('should respect partialInclusion: false', () => {
        mockFlowCore.config.boxSelection.partialInclusion = false;
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1', 'node2', 'node3']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 600, y: 400 },
        });
        instance.handle(endEvent);

        expect(mockCommandHandler.emit).toHaveBeenCalled();
      });
    });

    describe('viewport transformation', () => {
      it('should transform client coordinates to flow coordinates', () => {
        const mockTransform = vi.fn((point) => ({
          x: point.x * 2,
          y: point.y * 2,
        }));
        mockFlowCore.clientToFlowPosition = mockTransform;
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 25, y: 25 },
        });
        instance.handle(startEvent);

        const endEvent = getSampleBoxSelectionEvent({
          phase: 'end',
          lastInputPoint: { x: 125, y: 125 },
        });
        instance.handle(endEvent);

        expect(mockTransform).toHaveBeenCalledWith({ x: 25, y: 25 });
        expect(mockTransform).toHaveBeenCalledWith({ x: 125, y: 125 });
      });
    });

    describe('realtime selection', () => {
      it('should update selection in realtime when enabled', () => {
        mockFlowCore.config.boxSelection.realtime = true;
        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1']));

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const continueEvent1 = getSampleBoxSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 150, y: 150 },
        });
        instance.handle(continueEvent1);

        expect(mockCommandHandler.emit).toHaveBeenCalledTimes(1);

        mockSpatialHash.queryIds.mockReturnValue(new Set(['node1', 'node2']));

        const continueEvent2 = getSampleBoxSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 450, y: 250 },
        });
        instance.handle(continueEvent2);

        expect(mockCommandHandler.emit).toHaveBeenCalledTimes(2);
      });

      it('should not update selection in realtime when disabled', () => {
        mockFlowCore.config.boxSelection.realtime = false;

        const startEvent = getSampleBoxSelectionEvent({
          phase: 'start',
          lastInputPoint: { x: 50, y: 50 },
        });
        instance.handle(startEvent);

        const continueEvent = getSampleBoxSelectionEvent({
          phase: 'continue',
          lastInputPoint: { x: 450, y: 250 },
        });
        instance.handle(continueEvent);

        expect(mockCommandHandler.emit).not.toHaveBeenCalled();
      });
    });
  });
});
