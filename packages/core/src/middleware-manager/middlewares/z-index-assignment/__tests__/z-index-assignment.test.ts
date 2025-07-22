import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../../flow-core';
import { mockEdge, mockNode } from '../../../../test-utils';
import type { Edge, Metadata, MiddlewareContext, MiddlewaresConfigFromMiddlewares, Node } from '../../../../types';
import type { MiddlewareExecutor } from '../../../middleware-executor';
import { DEFAULT_SELECTED_Z_INDEX } from '../constants';
import { zIndexMiddleware, ZIndexMiddlewareMetadata } from '../z-index-assignment';

type Helpers = ReturnType<MiddlewareExecutor<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>>['helpers']>;

describe('zIndexMiddleware', () => {
  let helpers: Partial<Helpers>;
  let nodesMap: Map<string, Node>;
  let edgesMap: Map<string, Edge>;
  let context: MiddlewareContext<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>, ZIndexMiddlewareMetadata>;
  let nextMock: ReturnType<typeof vi.fn>;
  let cancelMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      checkIfAnyEdgePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
      getAffectedEdgeIds: vi.fn(),
    };
    nodesMap = new Map();
    edgesMap = new Map();
    nextMock = vi.fn();
    cancelMock = vi.fn();
    context = {
      state: {
        nodes: [],
        edges: [],
        metadata: {} as Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      },
      helpers: helpers as Helpers,
      nodesMap,
      edgesMap,
      flowCore: {} as FlowCore,
      modelActionType: 'updateNode',
      middlewareMetadata: {
        enabled: true,
        selectedZIndex: DEFAULT_SELECTED_Z_INDEX,
      },
    } as unknown as MiddlewareContext<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>, ZIndexMiddlewareMetadata>;
  });

  describe('default metadata', () => {
    it('should have correct default metadata', () => {
      expect(zIndexMiddleware.defaultMetadata).toEqual({
        enabled: true,
        selectedZIndex: DEFAULT_SELECTED_Z_INDEX,
      });
    });
  });

  describe('execution conditions', () => {
    it('should call next() without changes when middleware is disabled', () => {
      context.middlewareMetadata.enabled = false;
      context.modelActionType = 'init';

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should call next() without changes when no relevant changes detected', () => {
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      context.modelActionType = 'updateNode';

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should process changes when init action is triggered', () => {
      context.modelActionType = 'init';
      context.state.nodes = [];
      context.state.edges = [];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalled();
    });

    it('should process changes when finishLinking action is triggered', () => {
      context.modelActionType = 'finishLinking';
      context.state.edges = [{ ...mockEdge, id: 'edge1' }];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalled();
    });
  });

  describe('node selection z-index assignment', () => {
    it('should assign selectedZIndex to newly selected nodes', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, zIndex: 0 };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', zIndex: DEFAULT_SELECTED_Z_INDEX }],
      });
    });

    it('should restore base z-index for deselected nodes without groupId', () => {
      const node1 = { ...mockNode, id: 'node1', selected: false, zIndex: DEFAULT_SELECTED_Z_INDEX };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', zIndex: 0 }],
      });
    });

    it('should assign group-based z-index for deselected nodes with groupId', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zIndex: 5 };
      const childNode = {
        ...mockNode,
        id: 'child1',
        selected: false,
        groupId: 'group1',
        zIndex: DEFAULT_SELECTED_Z_INDEX,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', zIndex: 6 }],
      });
    });

    it('should use selectedZIndex as base for selected nodes with zOrder', () => {
      const selectedNode = { ...mockNode, id: 'node1', selected: true, zOrder: 10, zIndex: 0 };
      nodesMap.set('node1', selectedNode);
      context.state.nodes = [selectedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', zIndex: 10 }],
      });
    });
  });

  describe('group hierarchy z-index assignment', () => {
    it('should assign correct z-index when groupId changes', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zIndex: 5 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', zIndex: 0 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', zIndex: 6 }],
      });
    });

    it('should not update selected nodes when groupId changes', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zIndex: 5 };
      const selectedChildNode = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        zIndex: DEFAULT_SELECTED_Z_INDEX,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', selectedChildNode);
      context.state.nodes = [groupNode, selectedChildNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });
  });

  describe('zOrder-based z-index assignment', () => {
    it('should assign zOrder as zIndex when zOrder changes', () => {
      const node1 = { ...mockNode, id: 'node1', zOrder: 15, zIndex: 0 };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', zIndex: 15 }],
      });
    });

    it('should not update nodes with same zOrder and zIndex', () => {
      const node1 = { ...mockNode, id: 'node1', zOrder: 15, zIndex: 15 };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });
  });

  describe('edge z-index assignment', () => {
    it('should assign selectedZIndex to selected edges', () => {
      const node1 = { ...mockNode, id: 'node1', zIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', zIndex: 3 };
      const selectedEdge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', selected: true, zIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', selectedEdge);
      context.state.edges = [selectedEdge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', zIndex: DEFAULT_SELECTED_Z_INDEX }],
      });
    });

    it('should assign max source/target z-index to deselected edges', () => {
      const node1 = { ...mockNode, id: 'node1', zIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', zIndex: 8 };
      const deselectedEdge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        selected: false,
        zIndex: DEFAULT_SELECTED_Z_INDEX,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', deselectedEdge);
      context.state.edges = [deselectedEdge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', zIndex: 8 }],
      });
    });

    it('should use edge zOrder if specified', () => {
      const node1 = { ...mockNode, id: 'node1', zIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', zIndex: 8 };
      const edgeWithZOrder = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        zOrder: 12,
        selected: false,
        zIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edgeWithZOrder);
      context.state.edges = [edgeWithZOrder];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', zIndex: 12 }],
      });
    });

    it('should process newly added edges on finishLinking', () => {
      const node1 = { ...mockNode, id: 'node1', zIndex: 3 };
      const node2 = { ...mockNode, id: 'node2', zIndex: 7 };
      const newEdge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', zIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', newEdge);
      context.state.edges = [newEdge];
      context.modelActionType = 'finishLinking';

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', zIndex: 7 }],
      });
    });

    it('should handle missing source/target nodes gracefully', () => {
      const edgeWithMissingNodes = { ...mockEdge, id: 'edge1', source: 'missing1', target: 'missing2', zIndex: 5 };

      edgesMap.set('edge1', edgeWithMissingNodes);
      context.state.edges = [edgeWithMissingNodes];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', zIndex: 0 }],
      });
    });
  });

  describe('initialization (init action)', () => {
    it('should initialize z-index for all nodes on init', () => {
      const rootNode = { ...mockNode, id: 'root1', zOrder: 5, zIndex: 0 };
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 3, zIndex: 0 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', zIndex: 0 };
      const edge = { ...mockEdge, id: 'edge1', source: 'root1', target: 'child1', zIndex: 0 };

      nodesMap.set('root1', rootNode);
      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      edgesMap.set('edge1', edge);

      context.state.nodes = [rootNode, groupNode, childNode];
      context.state.edges = [edge];
      context.modelActionType = 'init';

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          { id: 'root1', zIndex: 5 },
          { id: 'group1', zIndex: 3 },
          { id: 'child1', zIndex: 1 },
        ],
        edgesToUpdate: [{ id: 'edge1', zIndex: 5 }],
      });
    });

    it('should handle nodes without zOrder on init', () => {
      const nodeWithoutZOrder = { ...mockNode, id: 'node1', zIndex: 10 };
      const edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node1', zIndex: 5 };

      nodesMap.set('node1', nodeWithoutZOrder);
      edgesMap.set('edge1', edge);

      context.state.nodes = [nodeWithoutZOrder];
      context.state.edges = [edge];
      context.modelActionType = 'init';

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', zIndex: 0 }],
        edgesToUpdate: [{ id: 'edge1', zIndex: 0 }],
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed node and edge updates', () => {
      const selectedNode = { ...mockNode, id: 'node1', selected: true, zIndex: 0 };
      const selectedEdge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node1', selected: true, zIndex: 0 };

      nodesMap.set('node1', selectedNode);
      edgesMap.set('edge1', selectedEdge);
      context.state.nodes = [selectedNode];
      context.state.edges = [selectedEdge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', zIndex: DEFAULT_SELECTED_Z_INDEX }],
        edgesToUpdate: [{ id: 'edge1', zIndex: DEFAULT_SELECTED_Z_INDEX }],
      });
    });

    it('should not update nodes/edges that already have correct z-index', () => {
      const nodeWithCorrectZIndex = { ...mockNode, id: 'node1', selected: true, zIndex: DEFAULT_SELECTED_Z_INDEX };
      const edgeWithCorrectZIndex = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node1',
        selected: true,
        zIndex: DEFAULT_SELECTED_Z_INDEX,
      };

      nodesMap.set('node1', nodeWithCorrectZIndex);
      edgesMap.set('edge1', edgeWithCorrectZIndex);
      context.state.nodes = [nodeWithCorrectZIndex];
      context.state.edges = [edgeWithCorrectZIndex];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });

    it('should handle custom selectedZIndex configuration', () => {
      const customSelectedZIndex = 2000;
      context.middlewareMetadata.selectedZIndex = customSelectedZIndex;

      const selectedNode = { ...mockNode, id: 'node1', selected: true, zIndex: 0 };
      nodesMap.set('node1', selectedNode);
      context.state.nodes = [selectedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', zIndex: customSelectedZIndex }],
      });
    });
  });

  describe('edge cases', () => {
    it('should handle missing nodes in nodesMap', () => {
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['missing-node']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });

    it('should handle missing edges in edgesMap', () => {
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['missing-edge']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });

    it('should handle missing group parent node', () => {
      const orphanedChild = { ...mockNode, id: 'child1', groupId: 'missing-group', selected: false, zIndex: 100 };
      nodesMap.set('child1', orphanedChild);
      context.state.nodes = [orphanedChild];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', zIndex: 0 }],
      });
    });
  });
});
