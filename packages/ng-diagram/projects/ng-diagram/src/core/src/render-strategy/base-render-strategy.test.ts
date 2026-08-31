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
    actionStateManager: { linking: { temporaryEdge: Edge } | null };
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
});
