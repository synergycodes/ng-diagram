import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEdge, mockNode } from '../../../../test-utils';
import type { Edge, FlowStateUpdate, Metadata, MiddlewareContext, Node } from '../../../../types';
import type { MiddlewareExecutor } from '../../../middleware-executor';
import { DEFAULT_SELECTED_Z_INDEX } from '../constants';
import { zIndexMiddleware } from '../z-index-assignment';

type Helpers = ReturnType<MiddlewareExecutor['helpers']>;

describe('zIndexMiddleware', () => {
  let helpers: Partial<Helpers>;
  let nodesMap: Map<string, Node>;
  let edgesMap: Map<string, Edge>;
  let context: MiddlewareContext;
  let nextMock: ReturnType<typeof vi.fn>;
  let cancelMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      checkIfAnyEdgePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
      getAffectedEdgeIds: vi.fn(),
      anyNodesAdded: vi.fn(),
      getAddedNodes: vi.fn(),
    };

    nodesMap = new Map();
    edgesMap = new Map();

    nextMock = vi.fn();
    cancelMock = vi.fn();
    context = {
      state: {
        nodes: [],
        edges: [],
        metadata: {} as Metadata,
      },
      helpers: helpers as Helpers,
      nodesMap,
      edgesMap,
      config: {
        zIndex: {
          enabled: true,
          selectedZIndex: DEFAULT_SELECTED_Z_INDEX,
          edgesAboveConnectedNodes: false,
          elevateOnSelection: true,
        },
      },
      modelActionType: 'updateNode',
      modelActionTypes: ['updateNode'],
    } as unknown as MiddlewareContext;
  });

  describe('execution conditions', () => {
    it('should call next() without changes when middleware is disabled', () => {
      context.config.zIndex.enabled = false;
      context.modelActionTypes = ['init'];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should call next() without changes when no relevant changes detected', () => {
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      context.modelActionTypes = ['updateNode'];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should process changes when init action is triggered', () => {
      context.modelActionTypes = ['init'];
      context.state.nodes = [];
      context.state.edges = [];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalled();
    });

    it('should process changes when finishLinking action is triggered', () => {
      context.modelActionTypes = ['finishLinking'];
      context.state.edges = [{ ...mockEdge, id: 'edge1' }];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalled();
    });

    it('should process changes when addEdges action is triggered', () => {
      context.modelActionTypes = ['addEdges'];
      context.state.edges = [{ ...mockEdge, id: 'edge1' }];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalled();
    });
  });

  describe('node selection z-index assignment', () => {
    it('should assign selectedZIndex to newly selected nodes', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: DEFAULT_SELECTED_Z_INDEX }],
      });
    });

    it('should restore base z-index for deselected nodes without groupId', () => {
      const node1 = { ...mockNode, id: 'node1', selected: false, computedZIndex: DEFAULT_SELECTED_Z_INDEX };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 0 }],
      });
    });

    it('should assign group-based z-index for deselected nodes with groupId', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 5 };
      const childNode = {
        ...mockNode,
        id: 'child1',
        selected: false,
        groupId: 'group1',
        computedZIndex: DEFAULT_SELECTED_Z_INDEX,
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
        nodesToUpdate: [{ id: 'child1', computedZIndex: 6 }],
      });
    });

    it('should use selectedZIndex as base for selected nodes with zOrder', () => {
      const selectedNode = { ...mockNode, id: 'node1', selected: true, zOrder: 10, computedZIndex: 0 };
      nodesMap.set('node1', selectedNode);
      context.state.nodes = [selectedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 10 }],
      });
    });
  });

  describe('group hierarchy z-index assignment', () => {
    it('should assign correct z-index when groupId changes', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 5 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', computedZIndex: 0 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 6 }],
      });
    });

    it('should not update selected nodes when groupId changes', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 5 };
      const selectedChildNode = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        computedZIndex: DEFAULT_SELECTED_Z_INDEX,
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

  describe('zOrder-based computedZIndex assignment', () => {
    it('should assign zOrder as computedZIndex when zOrder changes', () => {
      const node1 = { ...mockNode, id: 'node1', zOrder: 15, computedZIndex: 0 };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 15 }],
      });
    });

    it('should not update nodes with same zOrder and computedZIndex', () => {
      const node1 = { ...mockNode, id: 'node1', zOrder: 15, computedZIndex: 15 };
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
      const node1 = { ...mockNode, id: 'node1', computedZIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 3 };
      const selectedEdge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', selectedEdge);
      context.state.edges = [selectedEdge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: DEFAULT_SELECTED_Z_INDEX }],
      });
    });

    it('should assign max source/target z-index to deselected edges', () => {
      const node1 = { ...mockNode, id: 'node1', computedZIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 8 };
      const deselectedEdge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        selected: false,
        computedZIndex: DEFAULT_SELECTED_Z_INDEX,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', deselectedEdge);
      context.state.edges = [deselectedEdge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 8 }],
      });
    });

    it('should use edge zOrder if specified', () => {
      const node1 = { ...mockNode, id: 'node1', computedZIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 8 };
      const edgeWithZOrder = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        zOrder: 12,
        selected: false,
        computedZIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edgeWithZOrder);
      context.state.edges = [edgeWithZOrder];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 12 }],
      });
    });

    it('should process newly added edges on finishLinking', () => {
      const node1 = { ...mockNode, id: 'node1', computedZIndex: 3 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 7 };
      const newEdge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', computedZIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', newEdge);
      context.state.edges = [newEdge];
      context.modelActionTypes = ['finishLinking'];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 7 }],
      });
    });

    it('should handle missing source/target nodes gracefully', () => {
      const edgeWithMissingNodes = {
        ...mockEdge,
        id: 'edge1',
        source: 'missing1',
        target: 'missing2',
        computedZIndex: 5,
      };

      edgesMap.set('edge1', edgeWithMissingNodes);
      context.state.edges = [edgeWithMissingNodes];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 0 }],
      });
    });
  });

  describe('initialization (init action)', () => {
    it('should initialize z-index for all nodes on init', () => {
      const rootNode = { ...mockNode, id: 'root1', zOrder: 5, computedZIndex: 0 };
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 3, computedZIndex: 0 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', computedZIndex: 0 };
      const edge = { ...mockEdge, id: 'edge1', source: 'root1', target: 'child1', computedZIndex: 0 };

      nodesMap.set('root1', rootNode);
      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      edgesMap.set('edge1', edge);

      context.state.nodes = [rootNode, groupNode, childNode];
      context.state.edges = [edge];
      context.modelActionTypes = ['init'];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          { id: 'root1', computedZIndex: 5 },
          { id: 'group1', computedZIndex: 3 },
          { id: 'child1', computedZIndex: 1 },
        ],
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 5 }],
      });
    });

    it('should handle nodes without zOrder on init', () => {
      const nodeWithoutZOrder = { ...mockNode, id: 'node1', computedZIndex: 10 };
      const edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node1', computedZIndex: 5 };

      nodesMap.set('node1', nodeWithoutZOrder);
      edgesMap.set('edge1', edge);

      context.state.nodes = [nodeWithoutZOrder];
      context.state.edges = [edge];
      context.modelActionTypes = ['init'];

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 0 }],
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 0 }],
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed node and edge updates', () => {
      const selectedNode = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const selectedEdge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node1',
        selected: true,
        computedZIndex: 0,
      };

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
        nodesToUpdate: [{ id: 'node1', computedZIndex: DEFAULT_SELECTED_Z_INDEX }],
        edgesToUpdate: [{ id: 'edge1', computedZIndex: DEFAULT_SELECTED_Z_INDEX }],
      });
    });

    it('should not update nodes/edges that already have correct z-index', () => {
      const nodeWithCorrectZIndex = {
        ...mockNode,
        id: 'node1',
        selected: true,
        computedZIndex: DEFAULT_SELECTED_Z_INDEX,
      };
      const edgeWithCorrectZIndex = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node1',
        selected: true,
        computedZIndex: DEFAULT_SELECTED_Z_INDEX,
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
      context.config.zIndex.selectedZIndex = customSelectedZIndex;

      const selectedNode = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      nodesMap.set('node1', selectedNode);
      context.state.nodes = [selectedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: customSelectedZIndex }],
      });
    });

    it('should not elevate selected nodes when elevateOnSelection is false', () => {
      context.config.zIndex.elevateOnSelection = false;

      const selectedNode = { ...mockNode, id: 'node1', selected: true, computedZIndex: 5 };
      nodesMap.set('node1', selectedNode);
      context.state.nodes = [selectedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // Should use base z-index (0) instead of selectedZIndex
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 0 }],
      });
    });

    it('should not elevate selected edges when elevateOnSelection is false', () => {
      context.config.zIndex.elevateOnSelection = false;

      const node1 = { ...mockNode, id: 'node1', computedZIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 3 };
      const selectedEdge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', selectedEdge);
      context.state.edges = [selectedEdge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // Should use max of source/target z-index (5) instead of selectedZIndex
      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 5 }],
      });
    });
  });

  describe('duplicate processing prevention', () => {
    it('should not reprocess nodes that were already processed during init when selection changes', () => {
      const node1 = { ...mockNode, id: 'node1', selected: false, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', selected: false, computedZIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      context.state.nodes = [node1, node2];

      // First, init action processes all nodes
      context.modelActionTypes = ['init'];
      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // Reset the mock
      nextMock.mockClear();

      // Now node1 becomes selected
      const selectedNode1 = { ...node1, selected: true };
      nodesMap.set('node1', selectedNode1);
      context.state.nodes = [selectedNode1, node2];
      context.modelActionTypes = ['updateNode'];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1', 'node2']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // Should only update node1 (selected), not node2 (already processed in init)
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: DEFAULT_SELECTED_Z_INDEX }],
      });
    });

    it('should process node only once when multiple conditions are true', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 5 };
      const childNode = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      // Both selected and groupId conditions are true
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation(
        (props) => props.includes('selected') || props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // Should process node only once with group-based z-index (group's z-index + 1)
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 6 }],
      });

      // Verify no duplicate updates
      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const nodeIds = updates.map((u) => u.id);
      expect(nodeIds).toHaveLength(1);
      expect(new Set(nodeIds).size).toBe(nodeIds.length);
    });

    it('should not create duplicate entries in nodesWithZIndex array', () => {
      // Test scenario where a node might be affected by multiple conditions
      // Node1: affected by both selected and groupId changes
      const node1 = { ...mockNode, id: 'node1', selected: true, groupId: 'group1', computedZIndex: 0 };
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 5 };

      nodesMap.set('node1', node1);
      nodesMap.set('group1', groupNode);
      context.state.nodes = [node1, groupNode];

      // Both selected and groupId conditions are true
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('selected')) return true;
        if (props.includes('groupId')) return true;
        return false;
      });
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Node1 is affected by both conditions
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('selected')) return ['node1'];
        if (props.includes('groupId')) return ['node1']; // same node in both conditions
        return [];
      });

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // Node1 should be processed only once (by the first condition that matches - selected)
      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const nodeIds = updates.map((u) => u.id);

      expect(nodeIds.length).toBe(1);
      expect(nodeIds[0]).toBe('node1');
      expect(updates[0].computedZIndex).toBe(6); // group's z-index (5) + 1
    });

    it('should allow zOrder to override previous processing (intentional behavior)', () => {
      // This is by design: zOrder represents explicit user intent (e.g., bringToFront/sendToBack)
      // and should always override any previous z-index calculations
      const node1 = { ...mockNode, id: 'node1', selected: true, zOrder: 15, computedZIndex: 0 };

      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      // Both selected and zOrder conditions are true
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('selected')) return true;
        if (props.includes('zOrder')) return true;
        return false;
      });
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Node1 is affected by both conditions
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('selected')) return ['node1'];
        if (props.includes('zOrder')) return ['node1'];
        return [];
      });

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // The zOrder condition intentionally allows duplicate processing
      // This ensures that explicit zOrder changes (user actions like bringToFront)
      // always take precedence over automatic z-index calculations
      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // The node is processed twice:
      // 1. By shouldSnapSelectedNode: uses assignNodeZIndex which respects zOrder for selected nodes
      // 2. By shouldSnapZOrderNode: directly assigns the zOrder value
      expect(updates.length).toBe(2);
      expect(updates.every((u) => u.id === 'node1')).toBe(true);
      expect(updates.every((u) => u.computedZIndex === 15)).toBe(true);
    });

    it('should ensure zOrder changes always update computedZIndex even if node was already processed', () => {
      // This test demonstrates why zOrder doesn't use processedNodeIds check
      // Scenario: A selected node gets a new zOrder via bringToFront command
      const node1 = { ...mockNode, id: 'node1', selected: true, zOrder: 100, computedZIndex: DEFAULT_SELECTED_Z_INDEX };

      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      // Only zOrder changed (node was already selected)
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('zOrder')) return true;
        return false;
      });
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      // Even though the node might have been processed during init or selection,
      // the zOrder change must still update the computedZIndex to reflect user's explicit intent
      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      expect(updates.length).toBe(1);
      expect(updates[0].id).toBe('node1');
      expect(updates[0].computedZIndex).toBe(100); // New zOrder value overrides previous computedZIndex
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
      const orphanedChild = {
        ...mockNode,
        id: 'child1',
        groupId: 'missing-group',
        selected: false,
        computedZIndex: 100,
      };
      nodesMap.set('child1', orphanedChild);
      context.state.nodes = [orphanedChild];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      zIndexMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 0 }],
      });
    });
  });
});
