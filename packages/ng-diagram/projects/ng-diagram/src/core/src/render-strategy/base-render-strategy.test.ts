import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../flow-core';
import { mockEdge, mockNode } from '../test-utils';
import type { Edge, Node } from '../types';
import { BaseRenderStrategy } from './base-render-strategy';
import type { RenderStrategyResult } from './render-strategy.interface';

class TestRenderStrategy extends BaseRenderStrategy {
  init(): void {
    this.render();
  }

  process(nodes: Node[], edges: Edge[]): RenderStrategyResult {
    return { nodes, edges, nodeIds: new Set(), edgeIds: new Set() };
  }

  isNodeRendered(): boolean {
    return true;
  }
}

describe('BaseRenderStrategy temporary edge handling', () => {
  const sourceNode: Node = { ...mockNode, id: 'source-node' };
  const temporaryEdge: Edge = { ...mockEdge, id: 'temp-edge', source: 'source-node', target: '', temporary: true };

  let drawMock: ReturnType<typeof vi.fn>;
  let mockFlowCore: {
    getState: ReturnType<typeof vi.fn>;
    getNodeById: ReturnType<typeof vi.fn>;
    actionStateManager: { linking: { temporaryEdge: Edge; relink?: { edgeId: string } } | null };
    renderer: { draw: ReturnType<typeof vi.fn> };
    config: { debugMode: boolean };
  };

  beforeEach(() => {
    drawMock = vi.fn();
    mockFlowCore = {
      getState: vi.fn().mockReturnValue({
        nodes: [sourceNode],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, scale: 1 } },
      }),
      getNodeById: vi.fn().mockReturnValue(sourceNode),
      actionStateManager: { linking: { temporaryEdge } },
      renderer: { draw: drawMock },
      config: { debugMode: false },
    };
  });

  const drawnEdges = (): Edge[] => drawMock.mock.calls[0][1];

  it('should append the temporary edge when its source is visible', () => {
    new TestRenderStrategy(mockFlowCore as unknown as FlowCore).init();

    expect(drawnEdges()).toContainEqual(temporaryEdge);
  });

  it('should skip the temporary edge when its source is effectively hidden', () => {
    mockFlowCore.getNodeById.mockReturnValue({ ...sourceNode, computedHidden: true });

    new TestRenderStrategy(mockFlowCore as unknown as FlowCore).init();

    // Hiding the source mid-gesture must not leave a rubber band dangling
    // from nothing.
    expect(drawnEdges()).not.toContainEqual(temporaryEdge);
  });

  it('should hide the relinked edge and show the temporary edge during a relink', () => {
    const relinkedEdge: Edge = { ...mockEdge, id: 'relinked-edge', source: 'source-node', target: 'other-node' };
    const otherEdge: Edge = { ...mockEdge, id: 'other-edge', source: 'a', target: 'b' };
    mockFlowCore.getState.mockReturnValue({
      nodes: [sourceNode],
      edges: [relinkedEdge, otherEdge],
      metadata: { viewport: { x: 0, y: 0, scale: 1 } },
    });
    mockFlowCore.actionStateManager = { linking: { temporaryEdge, relink: { edgeId: 'relinked-edge' } } };

    new TestRenderStrategy(mockFlowCore as unknown as FlowCore).init();

    // The temporary edge represents the relinked edge for the duration of the
    // gesture — rendering both would show the stale original underneath.
    expect(drawnEdges()).not.toContainEqual(relinkedEdge);
    expect(drawnEdges()).toContainEqual(otherEdge);
    expect(drawnEdges()).toContainEqual(temporaryEdge);
  });

  it('should render the relinked edge again when no relink is in progress', () => {
    const edge: Edge = { ...mockEdge, id: 'relinked-edge', source: 'source-node', target: 'other-node' };
    mockFlowCore.getState.mockReturnValue({
      nodes: [sourceNode],
      edges: [edge],
      metadata: { viewport: { x: 0, y: 0, scale: 1 } },
    });
    mockFlowCore.actionStateManager = { linking: null };

    new TestRenderStrategy(mockFlowCore as unknown as FlowCore).init();

    expect(drawnEdges()).toContainEqual(edge);
  });
});
