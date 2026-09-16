import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../../flow-core';
import { mockEdge, mockNode, mockPort } from '../../../../test-utils';
import type { Edge } from '../../../../types';
import {
  connectionContextForGesture,
  createFinalEdge,
  createTemporaryEdge,
  isProperSourcePort,
  isProperTargetPort,
  validateConnection,
} from '../utils';

describe('linking utils', () => {
  describe('isProperTargetPort', () => {
    const targetPort = { ...mockPort, id: 'in', type: 'target' as const, nodeId: 'node-b' };

    it('should reject source-typed ports', () => {
      expect(isProperTargetPort({ ...targetPort, type: 'source' }, 'node-a', 'out')).toBe(false);
    });

    it('should accept any target-capable port when there is no source at all', () => {
      // A draw started from empty canvas, or relinking an edge whose other end
      // is dangling, has neither a source node nor a source port.
      expect(isProperTargetPort(targetPort, undefined, undefined)).toBe(true);
    });

    it('should accept a port on another node', () => {
      expect(isProperTargetPort(targetPort, 'node-a', 'out')).toBe(true);
    });

    it('should accept a different port on the same node', () => {
      expect(isProperTargetPort({ ...targetPort, nodeId: 'node-a' }, 'node-a', 'out')).toBe(true);
    });

    it('should reject the source port itself', () => {
      expect(isProperTargetPort({ ...targetPort, id: 'out', nodeId: 'node-a' }, 'node-a', 'out')).toBe(false);
    });
  });

  describe('isProperSourcePort', () => {
    const sourcePort = { ...mockPort, id: 'out', type: 'source' as const, nodeId: 'node-a' };

    it('should reject target-typed ports', () => {
      expect(isProperSourcePort({ ...sourcePort, type: 'target' }, 'node-b', 'in')).toBe(false);
    });

    it('should accept any source-capable port when there is no fixed target', () => {
      expect(isProperSourcePort(sourcePort, undefined, undefined)).toBe(true);
    });

    it('should accept a port on another node', () => {
      expect(isProperSourcePort(sourcePort, 'node-b', 'in')).toBe(true);
    });

    it('should reject the fixed target port itself', () => {
      expect(isProperSourcePort({ ...sourcePort, id: 'in', nodeId: 'node-b' }, 'node-b', 'in')).toBe(false);
    });
  });

  describe('createTemporaryEdge', () => {
    const config = {
      linking: {
        temporaryEdgeDataBuilder: (edge: unknown) => edge,
      },
    } as unknown as Parameters<typeof createTemporaryEdge>[0];

    it('should apply the default arrowhead when the caller does not mention the property', () => {
      const edge = createTemporaryEdge(config, { source: 'node-a' });

      expect(edge.targetArrowhead).toBe('ng-diagram-arrow');
      expect(edge).toMatchObject({ id: 'TEMPORARY_EDGE', temporary: true, source: 'node-a', target: '' });
    });

    it('should honor an explicit undefined arrowhead key from the caller', () => {
      // A relink preview passes the original edge's arrowheads through,
      // including explicit undefined for "no arrowhead".
      const edge = createTemporaryEdge(config, { source: 'node-a', targetArrowhead: undefined });

      expect(edge.targetArrowhead).toBeUndefined();
    });

    it('should default empty source and target to empty strings', () => {
      const edge = createTemporaryEdge(config, {});

      expect(edge.source).toBe('');
      expect(edge.target).toBe('');
    });
  });

  describe('createFinalEdge', () => {
    const config = {
      linking: {
        finalEdgeDataBuilder: (edge: Edge) => edge,
      },
      computeEdgeId: () => 'fresh-id',
    } as unknown as Parameters<typeof createFinalEdge>[0];

    it('should build a kept dangling edge with a fresh id, temporary false and an undefined free port', () => {
      const temporaryEdge: Edge = {
        ...mockEdge,
        id: 'TEMPORARY_EDGE',
        temporary: true,
        source: 'node-a',
        sourcePort: 'out',
        target: '',
        targetPort: '',
      };

      const finalEdge = createFinalEdge(config, temporaryEdge, {
        target: '',
        targetPort: undefined,
        targetPosition: { x: 50, y: 60 },
      });

      // Passthrough builder: this is the exact shape committed to the model.
      expect(finalEdge).toEqual({
        ...temporaryEdge,
        id: 'fresh-id',
        temporary: false,
        target: '',
        targetPort: undefined,
        targetPosition: { x: 50, y: 60 },
      });
      expect(finalEdge.id).toBe('fresh-id');
      expect(finalEdge.temporary).toBe(false);
      expect(finalEdge.target).toBe('');
      expect(finalEdge.targetPort).toBeUndefined();
    });
  });

  describe('validateConnection', () => {
    const candidateNode = {
      ...mockNode,
      id: 'node-c',
      measuredPorts: [{ ...mockPort, id: 'in-c', type: 'target' as const, nodeId: 'node-c' }],
    };
    let core: {
      getEdgeById: ReturnType<typeof vi.fn>;
      getNodeById: ReturnType<typeof vi.fn>;
      config: {
        linking: { validateConnection: ReturnType<typeof vi.fn> };
      };
    };

    beforeEach(() => {
      core = {
        getEdgeById: vi.fn().mockReturnValue(mockEdge),
        getNodeById: vi.fn().mockReturnValue(candidateNode),
        config: {
          linking: { validateConnection: vi.fn().mockReturnValue(true) },
        },
      };
    });

    it('should pass the given context through to the config validator', () => {
      const context = { reason: 'relink' as const, edge: mockEdge, end: 'target' as const };

      const result = validateConnection(
        core as unknown as FlowCore,
        undefined,
        undefined,
        'node-c',
        'in-c',
        true,
        context
      );

      expect(result).toBe(true);
      expect(core.config.linking.validateConnection).toHaveBeenCalledWith(
        null,
        null,
        candidateNode,
        candidateNode.measuredPorts[0],
        context
      );
    });

    it('should default the context to a draw when none is given', () => {
      validateConnection(core as unknown as FlowCore, undefined, undefined, 'node-c', 'in-c', true);

      expect(core.config.linking.validateConnection).toHaveBeenCalledWith(
        null,
        null,
        candidateNode,
        candidateNode.measuredPorts[0],
        {
          reason: 'draw',
        }
      );
    });
  });

  describe('connectionContextForGesture', () => {
    it('should build a relink context with the live edge', () => {
      const liveEdge = { ...mockEdge, id: 'edge-1' };
      const core = { getEdgeById: vi.fn().mockReturnValue(liveEdge) };

      const context = connectionContextForGesture(core as unknown as FlowCore, {
        edgeId: 'edge-1',
        end: 'source',
        originalEdge: mockEdge,
      });

      expect(context).toEqual({ reason: 'relink', edge: liveEdge, end: 'source' });
    });

    it('should fall back to the original edge snapshot when the edge left the model', () => {
      const core = { getEdgeById: vi.fn().mockReturnValue(undefined) };
      const originalEdge = { ...mockEdge, id: 'edge-1' };

      const context = connectionContextForGesture(core as unknown as FlowCore, {
        edgeId: 'edge-1',
        end: 'target',
        originalEdge,
      });

      expect(context).toEqual({ reason: 'relink', edge: originalEdge, end: 'target' });
    });

    it('should build a draw context outside a relink', () => {
      const core = { getEdgeById: vi.fn() };

      expect(connectionContextForGesture(core as unknown as FlowCore, undefined)).toEqual({ reason: 'draw' });
    });
  });
});
