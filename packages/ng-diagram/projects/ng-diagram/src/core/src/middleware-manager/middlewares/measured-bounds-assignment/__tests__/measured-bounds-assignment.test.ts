/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MiddlewareContext, Node } from '../../../../types';
import { measuredBoundsMiddleware } from '../measured-bounds-assignment';

describe('measuredBoundsMiddleware', () => {
  let mockContext: Partial<MiddlewareContext>;
  let mockNext: ReturnType<typeof vi.fn>;
  let nodesMap: Map<string, Node>;

  beforeEach(() => {
    nodesMap = new Map();
    mockNext = vi.fn();

    mockContext = {
      nodesMap,
      modelActionType: 'updateNode',
      helpers: {
        anyNodesAdded: vi.fn(() => false),
        checkIfAnyNodePropsChanged: vi.fn(() => false),
        getAddedNodes: vi.fn(() => []),
        getAffectedNodeIds: vi.fn(() => []),
      } as any,
    };
  });

  describe('init case', () => {
    beforeEach(() => {
      mockContext.modelActionType = 'init';
    });

    it('should calculate measured bounds for all fully measured nodes', () => {
      const node1: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
      };
      const node2: Node = {
        id: 'node2',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToUpdate: [
          { id: 'node1', measuredBounds: expect.any(Object) },
          { id: 'node2', measuredBounds: expect.any(Object) },
        ],
      });
    });

    it('should skip nodes without valid size', () => {
      const node1: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
      };
      const node2: Node = {
        id: 'node2',
        position: { x: 100, y: 100 },
        size: undefined, // Invalid
        data: {},
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', measuredBounds: expect.any(Object) }],
      });
    });

    it('should skip nodes without valid position', () => {
      const node1: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
      };
      const node2: Node = {
        id: 'node2',
        position: undefined as any, // Invalid
        size: { width: 200, height: 100 },
        data: {},
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', measuredBounds: expect.any(Object) }],
      });
    });

    it('should skip nodes with unmeasured ports', () => {
      const node1: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
      };
      const node2: Node = {
        id: 'node2',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
        measuredPorts: [
          {
            id: 'port1',
            position: undefined, // Invalid port
            size: { width: 10, height: 10 },
            type: 'both',
            nodeId: 'node2',
            side: 'top',
          },
        ],
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', measuredBounds: expect.any(Object) }],
      });
    });

    it('should call next with empty object if no nodes are measured', () => {
      const node1: Node = {
        id: 'node1',
        position: undefined as any,
        size: undefined,
        data: {},
      };

      nodesMap.set('node1', node1);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({});
    });
  });

  describe('non-init case - early exit', () => {
    it('should exit early if no nodes added and no relevant props changed', () => {
      mockContext.helpers!.anyNodesAdded = vi.fn(() => false);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => false);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockContext.helpers!.checkIfAnyNodePropsChanged).toHaveBeenCalledWith([
        'position',
        'size',
        'angle',
        'measuredPorts',
      ]);
    });

    it('should NOT exit early if nodes were added', () => {
      mockContext.helpers!.anyNodesAdded = vi.fn(() => true);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => false);
      mockContext.helpers!.getAddedNodes = vi.fn(() => []);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({});
      expect(mockContext.helpers!.getAddedNodes).toHaveBeenCalled();
    });

    it('should NOT exit early if relevant props changed', () => {
      mockContext.helpers!.anyNodesAdded = vi.fn(() => false);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => true);
      mockContext.helpers!.getAffectedNodeIds = vi.fn(() => []);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({});
      expect(mockContext.helpers!.getAffectedNodeIds).toHaveBeenCalledWith([
        'position',
        'size',
        'angle',
        'measuredPorts',
      ]);
    });
  });

  describe('added nodes', () => {
    it('should add measured bounds to newly added fully measured nodes', () => {
      const addedNode: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
        type: 'custom',
      };

      mockContext.helpers!.anyNodesAdded = vi.fn(() => true);
      mockContext.helpers!.getAddedNodes = vi.fn(() => [addedNode]);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => false);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToAdd: [
          {
            ...addedNode,
            measuredBounds: expect.any(Object),
          },
        ],
      });
    });

    it('should preserve all properties from previous middlewares in nodesToAdd', () => {
      const addedNode: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: { customProp: 'value' },
        type: 'custom',
        selected: true,
        angle: 45,
        zOrder: 10,
      };

      mockContext.helpers!.anyNodesAdded = vi.fn(() => true);
      mockContext.helpers!.getAddedNodes = vi.fn(() => [addedNode]);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => false);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      const call = mockNext.mock.calls[0][0];
      expect(call.nodesToAdd[0]).toMatchObject({
        id: 'node1',
        type: 'custom',
        selected: true,
        angle: 45,
        zOrder: 10,
        data: { customProp: 'value' },
        measuredBounds: expect.any(Object),
      });
    });

    it('should skip added nodes that are not fully measured', () => {
      const addedNode1: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
      };
      const addedNode2: Node = {
        id: 'node2',
        position: { x: 100, y: 100 },
        size: undefined, // Not measured
        data: {},
      };

      mockContext.helpers!.anyNodesAdded = vi.fn(() => true);
      mockContext.helpers!.getAddedNodes = vi.fn(() => [addedNode1, addedNode2]);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => false);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToAdd: [
          {
            ...addedNode1,
            measuredBounds: expect.any(Object),
          },
        ],
      });
    });
  });

  describe('updated nodes', () => {
    beforeEach(() => {
      mockContext.helpers!.anyNodesAdded = vi.fn(() => false);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => true);
    });

    it('should recalculate bounds for nodes with changed properties', () => {
      const node: Node = {
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };

      nodesMap.set('node1', node);
      mockContext.helpers!.getAffectedNodeIds = vi.fn(() => ['node1']);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToUpdate: [
          {
            id: 'node1',
            measuredBounds: expect.any(Object),
          },
        ],
      });
    });

    it('should only include id and measuredBounds in nodesToUpdate', () => {
      const node: Node = {
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
        type: 'custom',
        selected: true,
      };

      nodesMap.set('node1', node);
      mockContext.helpers!.getAffectedNodeIds = vi.fn(() => ['node1']);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      const call = mockNext.mock.calls[0][0];
      expect(Object.keys(call.nodesToUpdate[0])).toEqual(['id', 'measuredBounds']);
    });

    it('should skip updated nodes that are not fully measured', () => {
      const node1: Node = {
        id: 'node1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };
      const node2: Node = {
        id: 'node2',
        position: { x: 200, y: 200 },
        size: undefined, // Not measured
        data: {},
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      mockContext.helpers!.getAffectedNodeIds = vi.fn(() => ['node1', 'node2']);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToUpdate: [
          {
            id: 'node1',
            measuredBounds: expect.any(Object),
          },
        ],
      });
    });

    it('should check for position, size, angle, and measuredPorts changes', () => {
      mockContext.helpers!.getAffectedNodeIds = vi.fn(() => []);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockContext.helpers!.checkIfAnyNodePropsChanged).toHaveBeenCalledWith([
        'position',
        'size',
        'angle',
        'measuredPorts',
      ]);
      expect(mockContext.helpers!.getAffectedNodeIds).toHaveBeenCalledWith([
        'position',
        'size',
        'angle',
        'measuredPorts',
      ]);
    });

    it('should handle nodes that do not exist in nodesMap', () => {
      mockContext.helpers!.getAffectedNodeIds = vi.fn(() => ['nonexistent']);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({});
    });
  });

  describe('combined add and update', () => {
    it('should handle both added and updated nodes in same execution', () => {
      const addedNode: Node = {
        id: 'added1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
      };
      const updatedNode: Node = {
        id: 'updated1',
        position: { x: 100, y: 100 },
        size: { width: 200, height: 100 },
        data: {},
      };

      nodesMap.set('updated1', updatedNode);

      mockContext.helpers!.anyNodesAdded = vi.fn(() => true);
      mockContext.helpers!.getAddedNodes = vi.fn(() => [addedNode]);
      mockContext.helpers!.checkIfAnyNodePropsChanged = vi.fn(() => true);
      mockContext.helpers!.getAffectedNodeIds = vi.fn(() => ['updated1']);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      expect(mockNext).toHaveBeenCalledWith({
        nodesToAdd: [
          {
            ...addedNode,
            measuredBounds: expect.any(Object),
          },
        ],
        nodesToUpdate: [
          {
            id: 'updated1',
            measuredBounds: expect.any(Object),
          },
        ],
      });
    });
  });

  describe('measured bounds calculation', () => {
    it('should calculate bounds including ports that extend beyond node', () => {
      const node: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        data: {},
        measuredPorts: [
          {
            id: 'port1',
            position: { x: -10, y: 0 }, // Extends left
            size: { width: 20, height: 20 },
            type: 'both',
            nodeId: 'node1',
            side: 'left',
          },
        ],
      };

      mockContext.modelActionType = 'init';
      nodesMap.set('node1', node);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      const call = mockNext.mock.calls[0][0];
      const measuredBounds = call.nodesToUpdate[0].measuredBounds;

      expect(measuredBounds.x).toBeLessThan(0); // Should include port extending left
    });

    it('should calculate bounds accounting for node rotation', () => {
      const node: Node = {
        id: 'node1',
        position: { x: 0, y: 0 },
        size: { width: 100, height: 50 },
        data: {},
        angle: 45, // Rotated
      };

      mockContext.modelActionType = 'init';
      nodesMap.set('node1', node);

      measuredBoundsMiddleware.execute(mockContext as MiddlewareContext, mockNext, vi.fn());

      const call = mockNext.mock.calls[0][0];
      const measuredBounds = call.nodesToUpdate[0].measuredBounds;

      // Rotated bounds should be different from non-rotated
      expect(measuredBounds).toBeDefined();
      expect(measuredBounds.width).toBeGreaterThan(100); // AABB of rotated rect is larger
    });
  });
});
