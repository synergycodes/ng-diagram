import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../../flow-core';
import { mockEdge, mockNode, mockPort } from '../../../../test-utils';
import { createTemporaryEdge, isProperSourcePort, isProperTargetPort, validateRelinkOrConnection } from '../utils';

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

  describe('validateRelinkOrConnection', () => {
    const candidateNode = {
      ...mockNode,
      id: 'node-c',
      measuredPorts: [{ ...mockPort, id: 'in-c', type: 'target' as const, nodeId: 'node-c' }],
    };
    let core: {
      getEdgeById: ReturnType<typeof vi.fn>;
      getNodeById: ReturnType<typeof vi.fn>;
      config: {
        edgeRelinking: { validateRelink?: ReturnType<typeof vi.fn> };
        linking: { validateConnection: ReturnType<typeof vi.fn> };
      };
    };

    beforeEach(() => {
      core = {
        getEdgeById: vi.fn().mockReturnValue(mockEdge),
        getNodeById: vi.fn().mockReturnValue(candidateNode),
        config: {
          edgeRelinking: {},
          linking: { validateConnection: vi.fn().mockReturnValue(true) },
        },
      };
    });

    it('should call validateRelink with the edge, end and candidate during a relink', () => {
      const validateRelink = vi.fn().mockReturnValue(false);
      core.config.edgeRelinking.validateRelink = validateRelink;

      const result = validateRelinkOrConnection(
        core as unknown as FlowCore,
        { edgeId: 'edge-1', end: 'target', originalEdge: mockEdge },
        'node-a',
        'out',
        'node-c',
        'in-c',
        true
      );

      expect(result).toBe(false);
      expect(validateRelink).toHaveBeenCalledWith(mockEdge, 'target', candidateNode, candidateNode.measuredPorts[0]);
      expect(core.config.linking.validateConnection).not.toHaveBeenCalled();
    });

    it('should pass the original edge snapshot when the edge is gone from the model', () => {
      const validateRelink = vi.fn().mockReturnValue(true);
      core.config.edgeRelinking.validateRelink = validateRelink;
      core.getEdgeById.mockReturnValue(undefined);
      const originalEdge = { ...mockEdge, id: 'edge-1' };

      validateRelinkOrConnection(
        core as unknown as FlowCore,
        { edgeId: 'edge-1', end: 'source', originalEdge },
        'node-c',
        'in-c',
        'node-b',
        'in',
        true
      );

      expect(validateRelink).toHaveBeenCalledWith(
        originalEdge,
        'source',
        candidateNode,
        candidateNode.measuredPorts[0]
      );
    });

    it('should fall back to validateConnection when validateRelink is not configured', () => {
      const result = validateRelinkOrConnection(
        core as unknown as FlowCore,
        { edgeId: 'edge-1', end: 'target', originalEdge: mockEdge },
        undefined,
        undefined,
        'node-c',
        'in-c',
        true
      );

      expect(result).toBe(true);
      expect(core.config.linking.validateConnection).toHaveBeenCalledWith(
        null,
        null,
        candidateNode,
        candidateNode.measuredPorts[0]
      );
    });

    it('should behave like validateConnection outside a relink', () => {
      core.config.edgeRelinking.validateRelink = vi.fn();

      validateRelinkOrConnection(core as unknown as FlowCore, undefined, undefined, undefined, 'node-c', 'in-c', true);

      expect(core.config.edgeRelinking.validateRelink).not.toHaveBeenCalled();
      expect(core.config.linking.validateConnection).toHaveBeenCalled();
    });
  });
});
