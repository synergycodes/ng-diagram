import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockEdge } from '../../../../test-utils';
import type { CommandHandler, Edge, LinkingActionState } from '../../../../types';
import type { InternalLinkingActionState } from '../../../../types/action-state.interface';
import { startRelinking } from '../start-relinking';

describe('startRelinking', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getEdgeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: {
      edgeRelinking: { enabled: boolean };
      linking: { temporaryEdgeDataBuilder: ReturnType<typeof vi.fn> };
      computeEdgeId: ReturnType<typeof vi.fn>;
    };
    actionStateManager: {
      linking: LinkingActionState | null;
      isLinking: ReturnType<typeof vi.fn>;
      clearLinking: ReturnType<typeof vi.fn>;
    };
  };

  const edge: Edge = {
    ...mockEdge,
    id: 'edge-1',
    type: 'custom-edge',
    source: 'node-a',
    sourcePort: 'out',
    target: 'node-b',
    targetPort: 'in',
    data: { label: 'relinked' },
    routing: 'orthogonal',
    sourceArrowhead: undefined,
    targetArrowhead: undefined,
    points: [
      { x: 10, y: 20 },
      { x: 50, y: 60 },
      { x: 90, y: 100 },
    ],
  };

  const linkingState = () => mockFlowCore.actionStateManager.linking as InternalLinkingActionState;

  beforeEach(() => {
    vi.clearAllMocks();

    const actionStateManager = {
      linking: null as LinkingActionState | null,
      isLinking: vi.fn(() => actionStateManager.linking !== null),
      clearLinking: vi.fn(() => {
        actionStateManager.linking = null;
      }),
    };

    mockFlowCore = {
      getEdgeById: vi.fn().mockReturnValue(edge),
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: {
        edgeRelinking: { enabled: true },
        linking: {
          // Passthrough builder — mirrors the default config's identity builder.
          temporaryEdgeDataBuilder: vi.fn((temporaryEdge: Edge) => temporaryEdge),
        },
        computeEdgeId: vi.fn(() => 'generated-edge-id'),
      },
      actionStateManager,
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
      register: vi.fn(),
    } as unknown as CommandHandler;
  });

  describe('refusals', () => {
    it('should do nothing when edgeRelinking is disabled', async () => {
      mockFlowCore.config.edgeRelinking.enabled = false;

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      expect(mockFlowCore.actionStateManager.linking).toBeNull();
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing when a linking gesture is already in progress', async () => {
      const existingLinking: LinkingActionState = {
        sourceNodeId: 'other-node',
        sourcePortId: '',
        temporaryEdge: null,
      };
      mockFlowCore.actionStateManager.linking = existingLinking;

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      expect(mockFlowCore.actionStateManager.linking).toBe(existingLinking);
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing when the edge does not exist', async () => {
      mockFlowCore.getEdgeById.mockReturnValue(undefined);

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'missing', end: 'target' });

      expect(mockFlowCore.actionStateManager.linking).toBeNull();
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing when the edge is temporary', async () => {
      mockFlowCore.getEdgeById.mockReturnValue({ ...edge, temporary: true });

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      expect(mockFlowCore.actionStateManager.linking).toBeNull();
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing when the edge is effectively hidden', async () => {
      mockFlowCore.getEdgeById.mockReturnValue({ ...edge, computedHidden: true });

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      expect(mockFlowCore.actionStateManager.linking).toBeNull();
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing when no dragged position can be resolved', async () => {
      mockFlowCore.getEdgeById.mockReturnValue({ ...edge, points: undefined, targetPosition: undefined });

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      expect(mockFlowCore.actionStateManager.linking).toBeNull();
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('dragging the target end', () => {
    it('should set the linking state with a temporary edge mirroring the edge', async () => {
      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      const linking = linkingState();
      expect(linking.sourceNodeId).toBe('node-a');
      expect(linking.sourcePortId).toBe('out');
      expect(linking.relink?.end).toBe('target');
      expect(linking.relink).toEqual({ edgeId: 'edge-1', end: 'target', originalEdge: edge });
      expect(linking._gestureId).toEqual(expect.any(Number));
      // The dragged end starts at the edge's last routed point; the fixed
      // source end carries the edge's identity into the preview.
      expect(linking.temporaryEdge).toMatchObject({
        id: 'TEMPORARY_EDGE',
        temporary: true,
        type: 'custom-edge',
        data: { label: 'relinked' },
        routing: 'orthogonal',
        source: 'node-a',
        sourcePort: 'out',
        sourcePosition: { x: 10, y: 20 },
        target: '',
        targetPort: '',
        targetPosition: { x: 90, y: 100 },
      });
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'startRelinking');
    });

    it('should not inject the default arrowhead into the preview of an arrowless edge', async () => {
      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      // The edge has explicit undefined arrowheads — createTemporaryEdge's
      // 'ng-diagram-arrow' default must not leak into the preview.
      expect(linkingState().temporaryEdge!.targetArrowhead).toBeUndefined();
      expect(linkingState().temporaryEdge!.sourceArrowhead).toBeUndefined();
    });

    it('should carry the edge arrowheads into the preview when present', async () => {
      mockFlowCore.getEdgeById.mockReturnValue({ ...edge, sourceArrowhead: 'circle', targetArrowhead: 'diamond' });

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'target' });

      expect(linkingState().temporaryEdge!.sourceArrowhead).toBe('circle');
      expect(linkingState().temporaryEdge!.targetArrowhead).toBe('diamond');
    });
  });

  describe('dragging the source end', () => {
    it('should keep the target end and float the source at the first routed point', async () => {
      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'source' });

      const linking = linkingState();
      expect(linking.relink?.end).toBe('source');
      expect(linking.relink).toEqual({ edgeId: 'edge-1', end: 'source', originalEdge: edge });
      expect(linking.temporaryEdge).toMatchObject({
        id: 'TEMPORARY_EDGE',
        temporary: true,
        source: '',
        sourcePort: '',
        sourcePosition: { x: 10, y: 20 },
        target: 'node-b',
        targetPort: 'in',
        targetPosition: { x: 90, y: 100 },
      });
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'startRelinking');
    });

    it('should fall back to the stored dangling position when the edge has no points', async () => {
      mockFlowCore.getEdgeById.mockReturnValue({
        ...edge,
        points: undefined,
        sourcePosition: { x: 7, y: 8 },
        targetPosition: { x: 70, y: 80 },
      });

      await startRelinking(mockCommandHandler, { name: 'startRelinking', edgeId: 'edge-1', end: 'source' });

      expect(linkingState().temporaryEdge!.sourcePosition).toEqual({ x: 7, y: 8 });
    });
  });
});
