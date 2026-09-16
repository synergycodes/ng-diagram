import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../flow-core';
import { mockEdge, mockNode, mockPort } from '../../../test-utils';
import type { Edge, Node } from '../../../types';
import type { DanglingEdgesConfig } from '../../../types/flow-config.interface';
import { partitionIncidentEdges } from '../detach-on-node-delete';

describe('partitionIncidentEdges', () => {
  // Port on the right side: flow position = node.position + port.position
  // + {width, height / 2} = (100 + 90 + 10, 200 + 45 + 5) = (200, 250).
  const nodeWithPort: Node = {
    ...mockNode,
    id: 'node-a',
    position: { x: 100, y: 200 },
    size: { width: 80, height: 40 },
    measuredPorts: [
      {
        ...mockPort,
        id: 'port-a',
        type: 'source',
        side: 'right',
        position: { x: 90, y: 45 },
        size: { width: 10, height: 10 },
        nodeId: 'node-a',
      },
    ],
  };

  // No ports: the detach anchor falls back to the node center = (330, 410).
  const nodeWithoutPorts: Node = {
    ...mockNode,
    id: 'node-b',
    position: { x: 300, y: 400 },
    size: { width: 60, height: 20 },
  };

  const portAnchor = { x: 200, y: 250 };
  const centerAnchor = { x: 330, y: 410 };

  // No routed points — the fallback chain (port → routed endpoint → node
  // center) is exercised per test; the routed-endpoint case has its own test.
  const incidentEdge: Edge = {
    ...mockEdge,
    id: 'edge-ab',
    source: 'node-a',
    sourcePort: 'port-a',
    target: 'node-b',
    points: undefined,
  };

  const nonIncidentEdge: Edge = {
    ...mockEdge,
    id: 'edge-xy',
    source: 'node-x',
    target: 'node-y',
  };

  let mockFlowCore: { config: { danglingEdges?: Partial<DanglingEdgesConfig> }; getNodeById: ReturnType<typeof vi.fn> };

  const flowCore = () => mockFlowCore as unknown as FlowCore;

  beforeEach(() => {
    mockFlowCore = {
      config: {},
      getNodeById: vi.fn((id: string) =>
        id === 'node-a' ? nodeWithPort : id === 'node-b' ? nodeWithoutPorts : undefined
      ),
    };
  });

  it('should remove every incident edge and update none when the feature is off', () => {
    const result = partitionIncidentEdges(flowCore(), [incidentEdge, nonIncidentEdge], new Set(['node-a']));

    expect(result.edgesToRemove).toEqual(['edge-ab']);
    expect(result.edgesToUpdate).toEqual([]);
  });

  it('should remove incident edges when enabled but detachOnNodeDelete is off', () => {
    mockFlowCore.config.danglingEdges = { enabled: true, detachOnNodeDelete: false };

    const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a']));

    expect(result.edgesToRemove).toEqual(['edge-ab']);
    expect(result.edgesToUpdate).toEqual([]);
  });

  describe('with enabled + detachOnNodeDelete', () => {
    beforeEach(() => {
      mockFlowCore.config.danglingEdges = { enabled: true, detachOnNodeDelete: true };
    });

    it('should detach the lost source endpoint anchored at its port flow position', () => {
      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a']));

      expect(result.edgesToRemove).toEqual([]);
      expect(result.edgesToUpdate).toEqual([
        { id: 'edge-ab', source: '', sourcePort: undefined, sourcePosition: portAnchor },
      ]);
    });

    it('should fall back to the node center when the endpoint has no port', () => {
      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-b']));

      expect(result.edgesToRemove).toEqual([]);
      expect(result.edgesToUpdate).toEqual([
        { id: 'edge-ab', target: '', targetPort: undefined, targetPosition: centerAnchor },
      ]);
    });

    it('should anchor at the node position when the node has no ports and no size', () => {
      mockFlowCore.getNodeById.mockReturnValue({ ...nodeWithoutPorts, size: undefined });

      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-b']));

      expect(result.edgesToUpdate).toEqual([
        { id: 'edge-ab', target: '', targetPort: undefined, targetPosition: { x: 300, y: 400 } },
      ]);
    });

    it('should anchor at the routed endpoint when the endpoint has no port but the edge has points', () => {
      const routedEdge: Edge = {
        ...incidentEdge,
        points: [
          { x: 10, y: 20 },
          { x: 350, y: 420 },
        ],
      };

      const result = partitionIncidentEdges(flowCore(), [routedEdge], new Set(['node-b']));

      expect(result.edgesToUpdate).toEqual([
        { id: 'edge-ab', target: '', targetPort: undefined, targetPosition: { x: 350, y: 420 } },
      ]);
    });

    it('should always remove explicitly deleted edges', () => {
      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a']), new Set(['edge-ab']));

      expect(result.edgesToRemove).toEqual(['edge-ab']);
      expect(result.edgesToUpdate).toEqual([]);
    });

    it('should remove the edge when shouldDetachOnNodeDelete denies the lost end', () => {
      const shouldDetachOnNodeDelete = vi.fn().mockReturnValue(false);
      mockFlowCore.config.danglingEdges!.shouldDetachOnNodeDelete = shouldDetachOnNodeDelete;

      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a']));

      expect(shouldDetachOnNodeDelete).toHaveBeenCalledWith(incidentEdge, nodeWithPort, 'source');
      expect(result.edgesToRemove).toEqual(['edge-ab']);
      expect(result.edgesToUpdate).toEqual([]);
    });

    it('should remove an edge losing both ends when no shouldDetachOnNodeDelete callback is set', () => {
      // Dual dangling is opt-in: detaching both ends by default would leave
      // dual-dangling debris at the deleted nodes' old positions.
      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a', 'node-b']));

      expect(result.edgesToRemove).toEqual(['edge-ab']);
      expect(result.edgesToUpdate).toEqual([]);
    });

    it('should produce a dual dangling patch when the callback allows both ends', () => {
      const shouldDetachOnNodeDelete = vi.fn().mockReturnValue(true);
      mockFlowCore.config.danglingEdges!.shouldDetachOnNodeDelete = shouldDetachOnNodeDelete;

      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a', 'node-b']));

      expect(shouldDetachOnNodeDelete).toHaveBeenCalledWith(incidentEdge, nodeWithPort, 'source');
      expect(shouldDetachOnNodeDelete).toHaveBeenCalledWith(incidentEdge, nodeWithoutPorts, 'target');
      expect(result.edgesToRemove).toEqual([]);
      expect(result.edgesToUpdate).toEqual([
        {
          id: 'edge-ab',
          source: '',
          sourcePort: undefined,
          sourcePosition: portAnchor,
          target: '',
          targetPort: undefined,
          targetPosition: centerAnchor,
        },
      ]);
    });

    it('should remove the edge losing both ends when the callback denies either end', () => {
      mockFlowCore.config.danglingEdges!.shouldDetachOnNodeDelete = (_edge, _node, end) => end !== 'target';

      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a', 'node-b']));

      expect(result.edgesToRemove).toEqual(['edge-ab']);
      expect(result.edgesToUpdate).toEqual([]);
    });

    it('should remove the edge when the lost endpoint node is effectively hidden', () => {
      mockFlowCore.getNodeById.mockImplementation((id: string) =>
        id === 'node-a' ? { ...nodeWithPort, computedHidden: true } : id === 'node-b' ? nodeWithoutPorts : undefined
      );

      const result = partitionIncidentEdges(flowCore(), [incidentEdge], new Set(['node-a']));

      expect(result.edgesToRemove).toEqual(['edge-ab']);
      expect(result.edgesToUpdate).toEqual([]);
    });

    it('should remove an effectively hidden edge instead of detaching it', () => {
      const hiddenEdge: Edge = { ...incidentEdge, computedHidden: true };

      const result = partitionIncidentEdges(flowCore(), [hiddenEdge], new Set(['node-a']));

      expect(result.edgesToRemove).toEqual(['edge-ab']);
      expect(result.edgesToUpdate).toEqual([]);
    });

    it('should delete the edges of hidden children when a collapsed group cascade is deleted', () => {
      // A3: deleting a group cascades to its (collapsed, hidden) children —
      // their invisible wiring must be deleted, never materialized as visible
      // dangling edges; a visible sibling's edge still detaches.
      const hiddenChildA: Node = { ...mockNode, id: 'child-a', computedHidden: true, position: { x: 0, y: 0 } };
      const hiddenChildB: Node = { ...mockNode, id: 'child-b', computedHidden: true, position: { x: 50, y: 0 } };
      const nodes: Record<string, Node> = {
        'child-a': hiddenChildA,
        'child-b': hiddenChildB,
        'node-b': nodeWithoutPorts,
      };
      mockFlowCore.getNodeById.mockImplementation((id: string) => nodes[id]);

      const childEdge: Edge = {
        ...mockEdge,
        id: 'edge-children',
        source: 'child-a',
        target: 'child-b',
        computedHidden: true,
        points: undefined,
      };
      const outgoingHiddenEdge: Edge = {
        ...mockEdge,
        id: 'edge-child-out',
        source: 'child-a',
        target: 'node-b',
        computedHidden: true,
        points: undefined,
      };
      const visibleEdgeToDeleted: Edge = {
        ...mockEdge,
        id: 'edge-visible',
        source: 'outside',
        target: 'node-b',
        points: undefined,
      };

      const result = partitionIncidentEdges(
        flowCore(),
        [childEdge, outgoingHiddenEdge, visibleEdgeToDeleted],
        new Set(['child-a', 'child-b', 'node-b'])
      );

      expect(result.edgesToRemove).toEqual(['edge-children', 'edge-child-out']);
      expect(result.edgesToUpdate).toEqual([
        { id: 'edge-visible', target: '', targetPort: undefined, targetPosition: centerAnchor },
      ]);
    });

    it('should leave non-incident edges untouched', () => {
      const result = partitionIncidentEdges(flowCore(), [incidentEdge, nonIncidentEdge], new Set(['node-a']));

      expect(result.edgesToRemove).not.toContain('edge-xy');
      expect(result.edgesToUpdate.map((update) => update.id)).not.toContain('edge-xy');
    });
  });
});
