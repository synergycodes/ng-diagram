import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockEdge, mockNode } from '../../../../test-utils';
import type { Edge, FlowStateUpdate, Metadata, MiddlewareContext, Node } from '../../../../types';
import type { MiddlewareExecutor } from '../../../middleware-executor';
import { zIndexMiddleware } from '../z-index-assignment';

const SELECTED_Z_INDEX = 100;

type Helpers = ReturnType<MiddlewareExecutor['helpers']>;

function buildConnectedEdgesMap(edges: Edge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const edge of edges) {
    if (!map.has(edge.source)) map.set(edge.source, []);
    map.get(edge.source)!.push(edge.id);
    if (!map.has(edge.target)) map.set(edge.target, []);
    map.get(edge.target)!.push(edge.id);
  }
  return map;
}

describe('zIndexMiddleware', () => {
  let helpers: Partial<Helpers>;
  let nodesMap: Map<string, Node>;
  let edgesMap: Map<string, Edge>;
  let context: MiddlewareContext;
  let nextMock: ReturnType<typeof vi.fn>;
  let cancelMock: ReturnType<typeof vi.fn>;

  /** Syncs initialConnectedEdgesMap from current edges and executes the middleware. */
  function executeMiddleware() {
    context.initialConnectedEdgesMap = buildConnectedEdgesMap(context.state.edges);
    zIndexMiddleware.execute(context, nextMock, cancelMock);
  }

  beforeEach(() => {
    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      checkIfAnyEdgePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
      getAffectedEdgeIds: vi.fn(),
      anyNodesAdded: vi.fn(),
      getAddedNodes: vi.fn(),
      getAddedEdges: vi.fn().mockReturnValue([]),
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
      initialConnectedEdgesMap: new Map(),
      config: {
        zIndex: {
          enabled: true,
          selectedZIndex: SELECTED_Z_INDEX,
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

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should call next() without changes when no relevant changes detected', () => {
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      context.modelActionTypes = ['updateNode'];

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should process changes when init action is triggered', () => {
      context.modelActionTypes = ['init'];
      context.state.nodes = [];
      context.state.edges = [];

      executeMiddleware();

      expect(nextMock).toHaveBeenCalled();
    });

    it('should process changes when finishLinking action is triggered', () => {
      context.modelActionTypes = ['finishLinking'];
      context.state.edges = [{ ...mockEdge, id: 'edge1' }];

      executeMiddleware();

      expect(nextMock).toHaveBeenCalled();
    });

    it('should process changes when addEdges action is triggered', () => {
      context.modelActionTypes = ['addEdges'];
      context.state.edges = [{ ...mockEdge, id: 'edge1' }];

      executeMiddleware();

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

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: SELECTED_Z_INDEX }],
      });
    });

    it('should restore base z-index for deselected nodes without groupId', () => {
      const node1 = { ...mockNode, id: 'node1', selected: false, computedZIndex: SELECTED_Z_INDEX };
      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 0 }],
      });
    });

    it('should assign group-based z-index for deselected nodes with groupId', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
      const childNode = {
        ...mockNode,
        id: 'child1',
        selected: false,
        groupId: 'group1',
        computedZIndex: SELECTED_Z_INDEX,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 6 }],
      });
    });

    it('should elevate selected node additively with zOrder', () => {
      // base = zOrder = 10, elevated = 10 + 100 = 110
      const selectedNode = { ...mockNode, id: 'node1', selected: true, zOrder: 10, computedZIndex: 0 };
      nodesMap.set('node1', selectedNode);
      context.state.nodes = [selectedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 10 + SELECTED_Z_INDEX }],
      });
    });

    it('should elevate selected node additively with high zOrder', () => {
      // base = zOrder = 5000, elevated = 5000 + 100 = 5100
      const selectedNode = { ...mockNode, id: 'node1', selected: true, zOrder: 5000, computedZIndex: 0 };
      nodesMap.set('node1', selectedNode);
      context.state.nodes = [selectedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 5000 + SELECTED_Z_INDEX }],
      });
    });
  });

  describe('group hierarchy z-index assignment', () => {
    it('should assign correct z-index when groupId changes', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', computedZIndex: 0 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 6 }],
      });
    });

    it('should correctly elevate selected nodes when groupId changes', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
      const selectedChildNode = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        computedZIndex: SELECTED_Z_INDEX,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', selectedChildNode);
      context.state.nodes = [groupNode, selectedChildNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      // child1 base = groupFloor(5+1=6), elevated = 6+100=106
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 6 + SELECTED_Z_INDEX }],
      });
    });

    it('should assign root-level z-index when node removed from group', () => {
      // Node was in group, now groupId=null. Should get root z-index based on zOrder.
      const node1 = { ...mockNode, id: 'node1', zOrder: 3, computedZIndex: 6 };

      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      // Root node, zOrder=3 → computedZIndex=3
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 3 }],
      });
    });

    it('should reprocess siblings when new node joins group via groupId change', () => {
      // group1 has existing child1 (zOrder=2). child2 (zOrder=1) joins group.
      // Both children should be re-sorted: child2(1) before child1(2).
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        zOrder: 2,
        computedZIndex: 1,
      };
      const child2 = {
        ...mockNode,
        id: 'child2',
        groupId: 'group1',
        zOrder: 1,
        computedZIndex: 5,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      nodesMap.set('child2', child2);
      context.state.nodes = [group1, child1, child2];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child2']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // Sort by zOrder: child2(1) then child1(2)
      // child2: slot=1, nonElevatedZ=max(1,1)=1
      // child1: slot=2, nonElevatedZ=max(2,2)=2
      const child1Z = updates.find((u) => u.id === 'child1')?.computedZIndex ?? child1.computedZIndex!;
      const child2Z = updates.find((u) => u.id === 'child2')!.computedZIndex!;

      expect(child2Z).toBe(1);
      expect(child1Z).toBe(2);
      expect(child1Z).toBeGreaterThan(child2Z);
    });

    it('should clamp negative zOrder when node with sendToBack zOrder joins group', () => {
      // Node had zOrder=-5 (from sendToBack at root level), now moved into group.
      // Negative zOrder should be clamped to group floor.
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 10 };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        zOrder: -5,
        computedZIndex: -5,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, child1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const childUpdate = updates.find((u) => u.id === 'child1');

      // Clamped: max(zOrder=-5, slot=11) = 11
      expect(childUpdate!.computedZIndex).toBe(11);
      expect(childUpdate!.computedZIndex).toBeGreaterThan(group1.computedZIndex!);
    });

    it('should assign correct z-index when node moves between groups', () => {
      // child1 moved from group1 to group2. Should get group2-relative z-index.
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const group2 = { ...mockNode, id: 'group2', isGroup: true, computedZIndex: 20 };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group2',
        computedZIndex: 1,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('group2', group2);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, group2, child1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group2 promoted as entry (base=20), child1: slot=21
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(21);
      // group2 not dirty → preserved, not in updates
      expect(updates.find((u) => u.id === 'group2')).toBeUndefined();
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

      executeMiddleware();

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

      executeMiddleware();

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

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

      // edge base = max(5, 3) = 5, elevated = 5 + 100 = 105
      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 5 + SELECTED_Z_INDEX }],
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
        computedZIndex: SELECTED_Z_INDEX,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', deselectedEdge);
      context.state.edges = [deselectedEdge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

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

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 12 }],
      });
    });

    it('should update edge computedZIndex when edge zOrder changes', () => {
      const node1 = { ...mockNode, id: 'node1', computedZIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 8 };
      const edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', zOrder: 20, computedZIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edge);
      context.state.edges = [edge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

      // edge.zOrder = 20 overrides max(source=5, target=8) = 8
      expect(nextMock).toHaveBeenCalledWith({
        edgesToUpdate: [{ id: 'edge1', computedZIndex: 20 }],
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
      (helpers.getAddedEdges as ReturnType<typeof vi.fn>).mockReturnValue([newEdge]);

      executeMiddleware();

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

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

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

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          { id: 'root1', computedZIndex: 5 },
          { id: 'group1', computedZIndex: 3 },
          { id: 'child1', computedZIndex: 4 },
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

      executeMiddleware();

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

      executeMiddleware();

      // node base=0, elevated=0+100=100. Edge base=max(100,100)=100, elevated=100+100=200
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 0 + SELECTED_Z_INDEX }],
        edgesToUpdate: [{ id: 'edge1', computedZIndex: SELECTED_Z_INDEX + SELECTED_Z_INDEX }],
      });
    });

    it('should not update nodes/edges that already have correct z-index', () => {
      // node base=0, elevated=0+100=100. Edge base=max(100,100)=100, elevated=100+100=200
      const nodeWithCorrectZIndex = {
        ...mockNode,
        id: 'node1',
        selected: true,
        computedZIndex: 0 + SELECTED_Z_INDEX,
      };
      const edgeWithCorrectZIndex = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node1',
        selected: true,
        computedZIndex: SELECTED_Z_INDEX + SELECTED_Z_INDEX,
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

      executeMiddleware();

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

      executeMiddleware();

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

      executeMiddleware();

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

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

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
      executeMiddleware();

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

      executeMiddleware();

      // Should only update node1 (selected), not node2 (already processed in init)
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: SELECTED_Z_INDEX }],
      });
    });

    it('should process node only once when multiple conditions are true', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
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

      executeMiddleware();

      // child1: base=6 (groupFloor=5+1), elevated=6+100=106
      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(6 + SELECTED_Z_INDEX);

      // Verify no duplicate node IDs
      const nodeIds = updates.map((u) => u.id);
      expect(new Set(nodeIds).size).toBe(nodeIds.length);
    });

    it('should not create duplicate entries in nodesWithZIndex array', () => {
      // Test scenario where a node might be affected by multiple conditions
      // Node1: affected by both selected and groupId changes
      const node1 = { ...mockNode, id: 'node1', selected: true, groupId: 'group1', computedZIndex: 0 };
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };

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
        if (props.includes('groupId')) return ['node1'];
        return [];
      });

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      // node1: base=6, elevated=106
      expect(updates.find((u) => u.id === 'node1')!.computedZIndex).toBe(6 + SELECTED_Z_INDEX);
      // No duplicate IDs
      const nodeIds = updates.map((u) => u.id);
      expect(new Set(nodeIds).size).toBe(nodeIds.length);
    });

    it('should keep elevation when both selection and zOrder change simultaneously', () => {
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

      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('selected')) return ['node1'];
        if (props.includes('zOrder')) return ['node1'];
        return [];
      });

      executeMiddleware();

      // Selection processes first: base=15, elevated=15+100=115. zOrder path: 15+100=115 (same). Last-write-wins = 115
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 15 + SELECTED_Z_INDEX }],
      });
    });

    it('should elevate additively when zOrder changes on selected node', () => {
      // base=zOrder=100, elevated=100+100=200. Was at 100, now 200 → update
      const node1 = { ...mockNode, id: 'node1', selected: true, zOrder: 100, computedZIndex: SELECTED_Z_INDEX };

      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('zOrder')) return true;
        return false;
      });
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 100 + SELECTED_Z_INDEX }],
      });
    });

    it('should elevate additively when high zOrder changes on selected node', () => {
      // base=5000, elevated=5000+100=5100. Was at 100, now 5100 → update
      const node1 = { ...mockNode, id: 'node1', selected: true, zOrder: 5000, computedZIndex: SELECTED_Z_INDEX };

      nodesMap.set('node1', node1);
      context.state.nodes = [node1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('zOrder')) return true;
        return false;
      });
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 5000 + SELECTED_Z_INDEX }],
      });
    });
  });

  describe('group containment invariant (child never below parent)', () => {
    it('should clamp negative zOrder child above group when group is selected', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, selected: true, computedZIndex: 0 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', zOrder: -1, computedZIndex: 1 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1', 'child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const groupUpdate = updates.find((u) => u.id === 'group1');
      const childUpdate = updates.find((u) => u.id === 'child1');

      expect(groupUpdate!.computedZIndex).toBe(SELECTED_Z_INDEX);
      expect(childUpdate!.computedZIndex).toBeGreaterThan(groupUpdate!.computedZIndex!);
    });

    it('should elevate grouped child to selectedZIndex when selected individually', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const childNode = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        zOrder: -1,
        computedZIndex: -1,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const childUpdate = updates.find((u) => u.id === 'child1');

      // base = Math.max(zOrder=-1, groupFloor=1) = 1, elevated = 1 + 100 = 101
      expect(childUpdate!.computedZIndex).toBe(1 + SELECTED_Z_INDEX);
    });

    it('should clamp negative zOrder child above group when child is deselected', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
      const childNode = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: false,
        zOrder: -1,
        computedZIndex: SELECTED_Z_INDEX,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const childUpdate = updates.find((u) => u.id === 'child1');

      expect(childUpdate!.computedZIndex).toBeGreaterThan(groupNode.computedZIndex!);
      expect(childUpdate!.computedZIndex).toBe(6);
    });

    it('should clamp negative zOrder when zOrder changes on grouped node', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', zOrder: -3, computedZIndex: 6 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      // child clamped to groupFloor (5+1=6), same as current → no update
      expect(nextMock).toHaveBeenCalledWith({});
    });

    it('should allow positive zOrder on grouped node when above group minimum', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', zOrder: 50, computedZIndex: 6 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 50 }],
      });
    });

    it('should allow negative zOrder on ungrouped node', () => {
      const node = { ...mockNode, id: 'node1', zOrder: -5, computedZIndex: 0 };

      nodesMap.set('node1', node);
      context.state.nodes = [node];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: -5 }],
      });
    });

    it('should reorder siblings when sendToBack changes zOrder on grouped node', () => {
      // Scenario: G has children N1 (no zOrder) and N2 (zOrder=-1 from sendToBack)
      // N2 should end up below N1 after zOrder change triggers parent group reprocessing
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const node1 = { ...mockNode, id: 'node1', groupId: 'group1', computedZIndex: 1 };
      const node2 = { ...mockNode, id: 'node2', groupId: 'group1', zOrder: -1, computedZIndex: 1 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      context.state.nodes = [groupNode, node1, node2];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node2']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const node1Update = updates.find((u) => u.id === 'node1');

      // N1 gets bumped up (from 1 to 2) because sort puts N2 first
      // N2 stays at 1 (no update needed — value unchanged)
      expect(node1Update!.computedZIndex).toBe(2);
      expect(node1Update!.computedZIndex).toBeGreaterThan(node2.computedZIndex!);
    });

    it('should initialize child with negative zOrder above parent', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const childNode = { ...mockNode, id: 'child1', groupId: 'group1', zOrder: -10, computedZIndex: 0 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];
      context.state.edges = [];
      context.modelActionTypes = ['init'];

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const childUpdate = updates.find((u) => u.id === 'child1');

      expect(childUpdate!.computedZIndex).toBe(1);
    });
  });

  describe('selection elevation with bringToFront/sendToBack', () => {
    it('should elevate bringToFront node above another bringToFront node on selection', () => {
      // Scenario: bringToFront(A) → zOrder=1, bringToFront(B) → zOrder=2, select A
      const nodeA = { ...mockNode, id: 'nodeA', selected: true, zOrder: 1, computedZIndex: 1 };
      const nodeB = { ...mockNode, id: 'nodeB', zOrder: 2, computedZIndex: 2 };

      nodesMap.set('nodeA', nodeA);
      nodesMap.set('nodeB', nodeB);
      context.state.nodes = [nodeA, nodeB];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['nodeA']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const nodeAUpdate = updates.find((u) => u.id === 'nodeA');

      // base=zOrder=1, elevated=1+100=101
      expect(nodeAUpdate!.computedZIndex).toBe(1 + SELECTED_Z_INDEX);
      expect(nodeAUpdate!.computedZIndex).toBeGreaterThan(nodeB.computedZIndex!);
    });

    it('should elevate selected grouped child above bringToFront sibling', () => {
      // Scenario: G1 has children G2 (bringToFront'd) and N, select N
      const group = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const bringToFrontChild = {
        ...mockNode,
        id: 'child-btf',
        isGroup: true,
        groupId: 'group1',
        zOrder: 1,
        computedZIndex: 1,
      };
      const normalChild = { ...mockNode, id: 'child-normal', groupId: 'group1', selected: true, computedZIndex: 1 };

      nodesMap.set('group1', group);
      nodesMap.set('child-btf', bringToFrontChild);
      nodesMap.set('child-normal', normalChild);
      context.state.nodes = [group, bringToFrontChild, normalChild];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child-normal']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const normalUpdate = updates.find((u) => u.id === 'child-normal');

      // selected child sorted after non-selected btf sibling: btf=1, normal=2, elevated=2+100=102
      expect(normalUpdate!.computedZIndex).toBe(2 + SELECTED_Z_INDEX);
      expect(normalUpdate!.computedZIndex).toBeGreaterThan(bringToFrontChild.computedZIndex!);
    });

    it('should not drop selected grouped node when bringToFront is called', () => {
      // Scenario: G2 inside G1, N inside G1, G2 selected (elevated), user clicks bringToFront on G2
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const group2 = {
        ...mockNode,
        id: 'group2',
        isGroup: true,
        groupId: 'group1',
        selected: true,
        computedZIndex: SELECTED_Z_INDEX,
      };
      const node = { ...mockNode, id: 'node1', groupId: 'group1', computedZIndex: 1 };

      nodesMap.set('group1', group1);
      nodesMap.set('group2', group2);
      nodesMap.set('node1', node);
      context.state.nodes = [group1, group2, node];

      // bringToFront sets zOrder=1, only zOrder changes (selection didn't change)
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('zOrder')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group2']);

      // Simulate bringToFront setting zOrder
      nodesMap.set('group2', { ...group2, zOrder: 1 });

      executeMiddleware();

      // Parent reprocessed, children sorted: [N(zOrder=0), G2(zOrder=1)]
      // N: z=1 (unchanged). G2: z=2, selected → elevated=2+100=102
      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const group2Update = updates.find((u) => u.id === 'group2');
      expect(group2Update!.computedZIndex).toBe(2 + SELECTED_Z_INDEX);
      expect(group2Update!.computedZIndex).toBeGreaterThan(1); // above sibling N at z=1
    });

    it('should preserve bringToFront ordering when parent group is selected', () => {
      // Scenario: G1 has children G2 (bringToFront'd, zOrder=2) and N (no zOrder)
      // Selecting G1 should keep G2 above N
      const group1 = { ...mockNode, id: 'group1', isGroup: true, selected: true, computedZIndex: 0 };
      const group2 = { ...mockNode, id: 'group2', isGroup: true, groupId: 'group1', zOrder: 2, computedZIndex: 2 };
      const node = { ...mockNode, id: 'node1', groupId: 'group1', computedZIndex: 1 };

      nodesMap.set('group1', group1);
      nodesMap.set('group2', group2);
      nodesMap.set('node1', node);
      context.state.nodes = [group1, group2, node];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const group2Update = updates.find((u) => u.id === 'group2');
      const nodeUpdate = updates.find((u) => u.id === 'node1');

      expect(group2Update!.computedZIndex).toBeGreaterThan(nodeUpdate!.computedZIndex!);
    });

    it('should allow selection to elevate above a previously bringToFront node', () => {
      // Scenario: bringToFront(N1) → zOrder=1, then select N2 → N2 should elevate above N1
      const node1 = { ...mockNode, id: 'node1', zOrder: 1, computedZIndex: 1 };
      const node2 = { ...mockNode, id: 'node2', selected: true, computedZIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      context.state.nodes = [node1, node2];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node2']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const node2Update = updates.find((u) => u.id === 'node2');

      // base=0, elevated=0+100=100
      expect(node2Update!.computedZIndex).toBe(0 + SELECTED_Z_INDEX);
      expect(node2Update!.computedZIndex).toBeGreaterThan(node1.computedZIndex!);
    });

    it('should elevate child when parent is deselected and child is selected simultaneously', () => {
      // Scenario: G1 was selected (elevated), click G2 → G1 deselected, G2 selected
      // Previous state: G1=100, G2=101, N=102 (all elevated). After: G1=0, G2 elevated, N=base
      const group1 = { ...mockNode, id: 'group1', isGroup: true, selected: false, computedZIndex: SELECTED_Z_INDEX };
      const group2 = {
        ...mockNode,
        id: 'group2',
        isGroup: true,
        groupId: 'group1',
        selected: true,
        computedZIndex: SELECTED_Z_INDEX + 1,
      };
      const node = { ...mockNode, id: 'node1', groupId: 'group1', computedZIndex: SELECTED_Z_INDEX + 2 };

      nodesMap.set('group1', group1);
      nodesMap.set('group2', group2);
      nodesMap.set('node1', node);
      context.state.nodes = [group1, group2, node];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1', 'group2']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const group1Update = updates.find((u) => u.id === 'group1');

      // G1 drops from 100 to 0
      expect(group1Update!.computedZIndex).toBe(0);
      // G2: base=1, elevated=1+100=101 (same as old 101 → may or may not be in updates)
      // N: base=2, was 102 → drops to 2
      // Key invariant: G2's final z-index > N's final z-index
      const g2Final = updates.find((u) => u.id === 'group2')?.computedZIndex ?? group2.computedZIndex;
      const nFinal = updates.find((u) => u.id === 'node1')?.computedZIndex ?? node.computedZIndex;
      expect(g2Final).toBeGreaterThan(nFinal!);
    });
  });

  describe('deselection with zOrder', () => {
    it('should restore zOrder for deselected ungrouped node', () => {
      const node = { ...mockNode, id: 'node1', selected: false, zOrder: 10, computedZIndex: SELECTED_Z_INDEX };
      nodesMap.set('node1', node);
      context.state.nodes = [node];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'node1', computedZIndex: 10 }],
      });
    });

    it('should restore children above group when group is deselected', () => {
      const groupNode = {
        ...mockNode,
        id: 'group1',
        isGroup: true,
        selected: false,
        computedZIndex: SELECTED_Z_INDEX,
      };
      const childNode = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        zOrder: -1,
        computedZIndex: SELECTED_Z_INDEX + 1,
      };

      nodesMap.set('group1', groupNode);
      nodesMap.set('child1', childNode);
      context.state.nodes = [groupNode, childNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1', 'child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];
      const groupUpdate = updates.find((u) => u.id === 'group1');
      const childUpdate = updates.find((u) => u.id === 'child1');

      expect(groupUpdate!.computedZIndex).toBe(0);
      expect(childUpdate!.computedZIndex).toBe(1);
      expect(childUpdate!.computedZIndex).toBeGreaterThan(groupUpdate!.computedZIndex!);
    });
  });

  describe('edgesAboveConnectedNodes', () => {
    it('should place edge above connected nodes when edgesAboveConnectedNodes is true', () => {
      context.config.zIndex.edgesAboveConnectedNodes = true;

      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 3 };
      const edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', computedZIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edge);
      context.state.nodes = [node1, node2];
      context.state.edges = [edge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];
      const edgeUpdate = edgeUpdates.find((e) => e.id === 'edge1');

      // Edge z-index = max(node1=1000, node2=3) + 1 = 1001
      expect(edgeUpdate!.computedZIndex).toBe(SELECTED_Z_INDEX + 1);
    });
  });

  describe('edge updates on node z-index changes', () => {
    it('should update edges connected to nodes whose z-index changed', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 3 };
      const edge = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', computedZIndex: 3 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edge);
      context.state.nodes = [node1, node2];
      context.state.edges = [edge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];
      const edgeUpdate = edgeUpdates.find((e) => e.id === 'edge1');

      // node1 elevated to 1000, edge = max(1000, 3) = 1000
      expect(edgeUpdate!.computedZIndex).toBe(SELECTED_Z_INDEX);
    });

    it('should not update edges whose connected nodes did not change z-index', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 5 };
      const node3 = { ...mockNode, id: 'node3', computedZIndex: 8 };
      const unaffectedEdge = { ...mockEdge, id: 'edge1', source: 'node2', target: 'node3', computedZIndex: 8 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      nodesMap.set('node3', node3);
      edgesMap.set('edge1', unaffectedEdge);
      context.state.nodes = [node1, node2, node3];
      context.state.edges = [unaffectedEdge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      // edge between node2-node3 should not be updated since neither node changed
      expect(stateUpdate.edgesToUpdate).toBeUndefined();
    });

    it('should handle simultaneous edge selection and node z-index changes', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 5 };
      const selectedEdge = {
        ...mockEdge,
        id: 'edge-sel',
        source: 'node1',
        target: 'node2',
        selected: true,
        computedZIndex: 0,
      };
      const connectedEdge = {
        ...mockEdge,
        id: 'edge-conn',
        source: 'node1',
        target: 'node2',
        selected: false,
        computedZIndex: 5,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge-sel', selectedEdge);
      edgesMap.set('edge-conn', connectedEdge);
      context.state.nodes = [node1, node2];
      context.state.edges = [selectedEdge, connectedEdge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge-sel']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];

      // edge-sel: selected, base=max(100,5)=100, elevated=100+100=200
      expect(edgeUpdates.find((e) => e.id === 'edge-sel')!.computedZIndex).toBe(SELECTED_Z_INDEX + SELECTED_Z_INDEX);
      // edge-conn: not selected, base=max(100,5)=100
      expect(edgeUpdates.find((e) => e.id === 'edge-conn')!.computedZIndex).toBe(SELECTED_Z_INDEX);
    });
  });

  describe('batch edge additions', () => {
    it('should process all added edges, not just the last one', () => {
      const node1 = { ...mockNode, id: 'node1', computedZIndex: 3 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 7 };
      const node3 = { ...mockNode, id: 'node3', computedZIndex: 2 };
      const edge1 = { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', computedZIndex: 0 };
      const edge2 = { ...mockEdge, id: 'edge2', source: 'node2', target: 'node3', computedZIndex: 0 };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      nodesMap.set('node3', node3);
      edgesMap.set('edge1', edge1);
      edgesMap.set('edge2', edge2);
      context.state.edges = [edge1, edge2];
      context.modelActionTypes = ['addEdges'];
      (helpers.getAddedEdges as ReturnType<typeof vi.fn>).mockReturnValue([edge1, edge2]);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];

      expect(edgeUpdates).toHaveLength(2);
      expect(edgeUpdates.find((e) => e.id === 'edge1')!.computedZIndex).toBe(7);
      expect(edgeUpdates.find((e) => e.id === 'edge2')!.computedZIndex).toBe(7);
    });
  });

  describe('concurrent selection and groupId changes', () => {
    it('should process both selection and groupId changes in the same update', () => {
      const groupNode = { ...mockNode, id: 'group1', isGroup: true, zOrder: 5, computedZIndex: 5 };
      const selectedNode = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const groupedNode = { ...mockNode, id: 'node2', groupId: 'group1', computedZIndex: 0 };

      nodesMap.set('group1', groupNode);
      nodesMap.set('node1', selectedNode);
      nodesMap.set('node2', groupedNode);
      context.state.nodes = [groupNode, selectedNode, groupedNode];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation(
        (props) => props.includes('selected') || props.includes('groupId')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockImplementation((props) => {
        if (props.includes('selected')) return ['node1'];
        if (props.includes('groupId')) return ['node2'];
        return [];
      });

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // node1: elevated via selection
      expect(updates.find((u) => u.id === 'node1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // node2: assigned group-relative z-index
      expect(updates.find((u) => u.id === 'node2')!.computedZIndex).toBe(6);
    });
  });

  describe('edge cases', () => {
    it('should handle missing nodes in nodesMap', () => {
      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['missing-node']);

      executeMiddleware();

      // Missing node skipped, dirty set empty → early exit
      expect(nextMock).toHaveBeenCalledWith();
    });

    it('should handle missing edges in edgesMap', () => {
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['missing-edge']);

      executeMiddleware();

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

      executeMiddleware();

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: 'child1', computedZIndex: 0 }],
      });
    });
  });

  describe('findEntryNodes behavior', () => {
    it('should preserve non-dirty parent computedZIndex when promoted as entry', () => {
      // group1 has computedZIndex=10 and is NOT dirty. child1 selection changes.
      // group1 is promoted as entry → should keep base=10, not recalculate from 0.
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 10 };
      const child1 = { ...mockNode, id: 'child1', groupId: 'group1', selected: true, computedZIndex: 0 };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, child1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1 preserves computedZIndex=10 → NOT in updates
      expect(updates.find((u) => u.id === 'group1')).toBeUndefined();
      // child1: slot=11, elevated=11+100=111
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(11 + SELECTED_Z_INDEX);
    });

    it('should skip child when parent is also dirty (parent covers subtree)', () => {
      // Both group1 and child1 selected (both dirty).
      // Only group1 (root) should be entry — child1 handled by recursion.
      const group1 = {
        ...mockNode,
        id: 'group1',
        isGroup: true,
        selected: true,
        computedZIndex: 0,
      };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, child1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1', 'child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1: base=0, selected → cumElev=100, computedZIndex=100
      expect(updates.find((u) => u.id === 'group1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // child1: slot=1, selected → cumElev=200, computedZIndex=201
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(1 + 2 * SELECTED_Z_INDEX);

      // No duplicate IDs
      const nodeIds = updates.map((u) => u.id);
      expect(new Set(nodeIds).size).toBe(nodeIds.length);
    });

    it('should share single parent entry for multiple dirty siblings', () => {
      // group1 not dirty, child1 and child2 both dirty (selected).
      // group1 promoted as entry once, both siblings processed together with correct sorting.
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        zOrder: 2,
        computedZIndex: 0,
      };
      const child2 = {
        ...mockNode,
        id: 'child2',
        groupId: 'group1',
        selected: true,
        zOrder: 1,
        computedZIndex: 0,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      nodesMap.set('child2', child2);
      context.state.nodes = [group1, child1, child2];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child1', 'child2']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // Both selected → sort by zOrder: child2(1) before child1(2)
      // child2: slot=1, zOrder=1 → nonElevatedZ=max(1,1)=1, cumElev=100, computedZIndex=101
      // child1: slot=2, zOrder=2 → nonElevatedZ=max(2,2)=2, cumElev=100, computedZIndex=102
      expect(updates.find((u) => u.id === 'child2')!.computedZIndex).toBe(1 + SELECTED_Z_INDEX);
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(2 + SELECTED_Z_INDEX);
    });

    it('should prune overlapping entries via ancestor walk', () => {
      // grandparent (dirty, root) → parent (not dirty, promoted as entry) → child (dirty)
      // Ancestor walk should prune parent since grandparent is also an entry.
      const grandparent = {
        ...mockNode,
        id: 'grandparent',
        isGroup: true,
        selected: true,
        computedZIndex: 0,
      };
      const parent = {
        ...mockNode,
        id: 'parent',
        isGroup: true,
        groupId: 'grandparent',
        computedZIndex: 1,
      };
      const child = {
        ...mockNode,
        id: 'child',
        groupId: 'parent',
        selected: true,
        computedZIndex: 2,
      };

      nodesMap.set('grandparent', grandparent);
      nodesMap.set('parent', parent);
      nodesMap.set('child', child);
      context.state.nodes = [grandparent, parent, child];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['grandparent', 'child']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // grandparent: base=0, selected → computedZIndex=100
      expect(updates.find((u) => u.id === 'grandparent')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // parent: slot=1, not selected → computedZIndex=101
      expect(updates.find((u) => u.id === 'parent')!.computedZIndex).toBe(1 + SELECTED_Z_INDEX);
      // child: slot=2, selected → cumElev=200, computedZIndex=202
      expect(updates.find((u) => u.id === 'child')!.computedZIndex).toBe(2 + 2 * SELECTED_Z_INDEX);

      // No duplicate IDs (would happen if parent entry wasn't pruned)
      const nodeIds = updates.map((u) => u.id);
      expect(new Set(nodeIds).size).toBe(nodeIds.length);
    });

    it('should handle select-all with nested groups — only root entries', () => {
      // All nodes dirty (selected). Only root becomes entry, all descendants processed via recursion.
      const group1 = {
        ...mockNode,
        id: 'group1',
        isGroup: true,
        selected: true,
        computedZIndex: 0,
      };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        zOrder: 1,
        computedZIndex: 0,
      };
      const group2 = {
        ...mockNode,
        id: 'group2',
        isGroup: true,
        groupId: 'group1',
        selected: true,
        zOrder: 2,
        computedZIndex: 0,
      };
      const child2 = {
        ...mockNode,
        id: 'child2',
        groupId: 'group2',
        selected: true,
        computedZIndex: 0,
      };

      // Insert group1's children in reverse zOrder to exercise sorting
      nodesMap.set('group1', group1);
      nodesMap.set('group2', group2);
      nodesMap.set('child2', child2);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, group2, child2, child1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue([
        'group1',
        'child1',
        'group2',
        'child2',
      ]);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // All 4 nodes should be in updates (all changed from 0)
      expect(updates).toHaveLength(4);

      // group1: base=0, selected → cumElev=100, computedZIndex=100
      expect(updates.find((u) => u.id === 'group1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // child1(zOrder=1): slot=1, selected → cumElev=200, computedZIndex=1+200=201
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(1 + 2 * SELECTED_Z_INDEX);
      // group2(zOrder=2): slot=2, selected → cumElev=200, computedZIndex=2+200=202
      expect(updates.find((u) => u.id === 'group2')!.computedZIndex).toBe(2 + 2 * SELECTED_Z_INDEX);
      // child2 inside group2: slot=3, selected → cumElev=300, computedZIndex=3+300=303
      expect(updates.find((u) => u.id === 'child2')!.computedZIndex).toBe(3 + 3 * SELECTED_Z_INDEX);

      // Verify hierarchy ordering: every node above its parent
      const g1z = updates.find((u) => u.id === 'group1')!.computedZIndex!;
      const c1z = updates.find((u) => u.id === 'child1')!.computedZIndex!;
      const g2z = updates.find((u) => u.id === 'group2')!.computedZIndex!;
      const c2z = updates.find((u) => u.id === 'child2')!.computedZIndex!;
      expect(c1z).toBeGreaterThan(g1z);
      expect(g2z).toBeGreaterThan(g1z);
      expect(c2z).toBeGreaterThan(g2z);
    });
  });

  describe('cumulative elevation', () => {
    it('should apply double elevation when parent and child are both selected', () => {
      // Parent selected (cumElev=100) → child selected (cumElev=200)
      const group1 = {
        ...mockNode,
        id: 'group1',
        isGroup: true,
        selected: true,
        computedZIndex: 0,
      };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, child1];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1', 'child1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1: 0 + 100 = 100
      expect(updates.find((u) => u.id === 'group1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // child1: 1 + 200 = 201 (double elevation)
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(1 + 2 * SELECTED_Z_INDEX);
    });

    it('should apply triple elevation in deeply nested all-selected hierarchy', () => {
      const group1 = {
        ...mockNode,
        id: 'group1',
        isGroup: true,
        selected: true,
        computedZIndex: 0,
      };
      const group2 = {
        ...mockNode,
        id: 'group2',
        isGroup: true,
        groupId: 'group1',
        selected: true,
        computedZIndex: 0,
      };
      const child = {
        ...mockNode,
        id: 'child',
        groupId: 'group2',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('group2', group2);
      nodesMap.set('child', child);
      context.state.nodes = [group1, group2, child];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1', 'group2', 'child']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1: 0 + 100 = 100
      expect(updates.find((u) => u.id === 'group1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // group2: 1 + 200 = 201
      expect(updates.find((u) => u.id === 'group2')!.computedZIndex).toBe(1 + 2 * SELECTED_Z_INDEX);
      // child: 2 + 300 = 302
      expect(updates.find((u) => u.id === 'child')!.computedZIndex).toBe(2 + 3 * SELECTED_Z_INDEX);
    });

    it('should not elevate children when only parent is selected', () => {
      const group1 = {
        ...mockNode,
        id: 'group1',
        isGroup: true,
        selected: true,
        computedZIndex: 0,
      };
      const child1 = { ...mockNode, id: 'child1', groupId: 'group1', computedZIndex: 0 };
      const child2 = { ...mockNode, id: 'child2', groupId: 'group1', computedZIndex: 0 };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      nodesMap.set('child2', child2);
      context.state.nodes = [group1, child1, child2];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['group1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1: cumElev=100, computedZIndex=100
      expect(updates.find((u) => u.id === 'group1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // Children inherit parent's cumulative elevation (100) but don't add their own
      // child1: slot=1, computedZIndex=1+100=101 (single elevation from parent)
      // child2: slot=2, computedZIndex=2+100=102
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(1 + SELECTED_Z_INDEX);
      expect(updates.find((u) => u.id === 'child2')!.computedZIndex).toBe(2 + SELECTED_Z_INDEX);
    });
  });

  describe('edge elevation with node selection', () => {
    it('should add node elevation to edge with explicit zOrder when connected node is selected', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 5 };
      const edge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        zOrder: 20,
        computedZIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edge);
      context.state.edges = [edge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];

      // edge.zOrder=20 overrides base. Node1 elevation=100.
      // Final: 20 + max(100, 0) = 120
      expect(edgeUpdates.find((e) => e.id === 'edge1')!.computedZIndex).toBe(20 + SELECTED_Z_INDEX);
    });

    it('should NOT add node elevation to edge without zOrder (already baked into base)', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 5 };
      const edge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        computedZIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edge);
      context.state.edges = [edge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];

      // No zOrder → base uses elevated node1 z-index directly: max(100, 5) = 100
      // No additional elevation needed (would double-count)
      expect(edgeUpdates.find((e) => e.id === 'edge1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
    });

    it('should add both node elevation and own selectedZIndex for selected edge with zOrder', () => {
      const node1 = { ...mockNode, id: 'node1', selected: true, computedZIndex: 0 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 5 };
      const edge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        zOrder: 20,
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edge);
      context.state.edges = [edge];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['node1']);
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];

      // zOrder=20, node elevation=100, own selection=100 → 20 + 100 + 100 = 220
      expect(edgeUpdates.find((e) => e.id === 'edge1')!.computedZIndex).toBe(20 + SELECTED_Z_INDEX + SELECTED_Z_INDEX);
    });

    it('should only add selectedZIndex for selected edge without zOrder (no node elevation)', () => {
      // Edge-only selection change, no node changes
      const node1 = { ...mockNode, id: 'node1', computedZIndex: 5 };
      const node2 = { ...mockNode, id: 'node2', computedZIndex: 3 };
      const edge = {
        ...mockEdge,
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('node1', node1);
      nodesMap.set('node2', node2);
      edgesMap.set('edge1', edge);
      context.state.edges = [edge];

      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.getAffectedEdgeIds as ReturnType<typeof vi.fn>).mockReturnValue(['edge1']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const edgeUpdates = stateUpdate.edgesToUpdate || [];

      // No zOrder → base = max(5, 3) = 5 (from nodesMap fallback), + selectedZIndex = 105
      expect(edgeUpdates.find((e) => e.id === 'edge1')!.computedZIndex).toBe(5 + SELECTED_Z_INDEX);
    });
  });

  describe('init with pre-selected nodes', () => {
    it('should elevate selected group and all children on init', () => {
      const group1 = { ...mockNode, id: 'group1', isGroup: true, selected: true, computedZIndex: 0 };
      const child1 = { ...mockNode, id: 'child1', groupId: 'group1', computedZIndex: 0 };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, child1];
      context.state.edges = [];
      context.modelActionTypes = ['init'];

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1: selected → cumElev=100, computedZIndex=100
      expect(updates.find((u) => u.id === 'group1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // child1: slot=1, inherits parent cumElev=100, computedZIndex=101
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(1 + SELECTED_Z_INDEX);
    });

    it('should elevate only selected child on init, not the group', () => {
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, child1];
      context.state.edges = [];
      context.modelActionTypes = ['init'];

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1: not selected → cumElev=0, computedZIndex=0 → no update (same as current)
      expect(updates.find((u) => u.id === 'group1')).toBeUndefined();
      // child1: slot=1, selected → cumElev=100, computedZIndex=101
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(1 + SELECTED_Z_INDEX);
    });

    it('should apply cumulative elevation on init when parent and child both selected', () => {
      const group1 = { ...mockNode, id: 'group1', isGroup: true, selected: true, computedZIndex: 0 };
      const child1 = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        selected: true,
        computedZIndex: 0,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', child1);
      context.state.nodes = [group1, child1];
      context.state.edges = [];
      context.modelActionTypes = ['init'];

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1: cumElev=100, computedZIndex=100
      expect(updates.find((u) => u.id === 'group1')!.computedZIndex).toBe(SELECTED_Z_INDEX);
      // child1: cumElev=200 (double), computedZIndex=201
      expect(updates.find((u) => u.id === 'child1')!.computedZIndex).toBe(1 + 2 * SELECTED_Z_INDEX);
    });
  });

  describe('node addition', () => {
    it('should assign z-index to newly added node in existing group', () => {
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 5 };
      const existingChild = {
        ...mockNode,
        id: 'child1',
        groupId: 'group1',
        zOrder: 1,
        computedZIndex: 6,
      };
      const newChild = { ...mockNode, id: 'child2', groupId: 'group1', zOrder: 2 };

      nodesMap.set('group1', group1);
      nodesMap.set('child1', existingChild);
      nodesMap.set('child2', newChild);
      context.state.nodes = [group1, existingChild, newChild];

      (helpers.anyNodesAdded as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAddedNodes as ReturnType<typeof vi.fn>).mockReturnValue([newChild]);
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // group1 promoted as entry (base=5). child1: slot=6, child2: slot=7
      // child1 was 6, new=6 → no update
      // child2 was undefined, new=7 → updated
      expect(updates.find((u) => u.id === 'child2')!.computedZIndex).toBe(7);
      expect(updates.find((u) => u.id === 'group1')).toBeUndefined();
    });

    it('should assign z-index to added root node', () => {
      const newNode = { ...mockNode, id: 'new1', zOrder: 3 };

      nodesMap.set('new1', newNode);
      context.state.nodes = [newNode];

      (helpers.anyNodesAdded as ReturnType<typeof vi.fn>).mockReturnValue(true);
      (helpers.getAddedNodes as ReturnType<typeof vi.fn>).mockReturnValue([newNode]);
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // Root node, zOrder=3, base=0 → computedZIndex=3
      expect(updates.find((u) => u.id === 'new1')!.computedZIndex).toBe(3);
    });
  });

  describe('selection-aware sorting', () => {
    it('should sort selected children after non-selected siblings', () => {
      // group1 not dirty. child-btf (zOrder=5, not selected) and child-sel (no zOrder, selected).
      // Selection-aware sort: non-selected first → child-btf, then child-sel.
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const childBtf = {
        ...mockNode,
        id: 'child-btf',
        groupId: 'group1',
        zOrder: 5,
        computedZIndex: 5,
      };
      const childSel = {
        ...mockNode,
        id: 'child-sel',
        groupId: 'group1',
        selected: true,
        computedZIndex: 1,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child-btf', childBtf);
      nodesMap.set('child-sel', childSel);
      context.state.nodes = [group1, childBtf, childSel];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['child-sel']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      const btfZ = updates.find((u) => u.id === 'child-btf')?.computedZIndex ?? childBtf.computedZIndex!;
      const selZ = updates.find((u) => u.id === 'child-sel')!.computedZIndex!;

      // child-sel should be ABOVE child-btf regardless of zOrder difference
      expect(selZ).toBeGreaterThan(btfZ);
    });

    it('should preserve zOrder ordering among selected siblings', () => {
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const selA = {
        ...mockNode,
        id: 'sel-a',
        groupId: 'group1',
        selected: true,
        zOrder: 1,
        computedZIndex: 0,
      };
      const selB = {
        ...mockNode,
        id: 'sel-b',
        groupId: 'group1',
        selected: true,
        zOrder: 3,
        computedZIndex: 0,
      };

      // Insert in reverse zOrder to exercise sorting
      nodesMap.set('group1', group1);
      nodesMap.set('sel-b', selB);
      nodesMap.set('sel-a', selA);
      context.state.nodes = [group1, selB, selA];

      (helpers.checkIfAnyNodePropsChanged as ReturnType<typeof vi.fn>).mockImplementation((props) =>
        props.includes('selected')
      );
      (helpers.checkIfAnyEdgePropsChanged as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (helpers.getAffectedNodeIds as ReturnType<typeof vi.fn>).mockReturnValue(['sel-a', 'sel-b']);

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      const aZ = updates.find((u) => u.id === 'sel-a')!.computedZIndex!;
      const bZ = updates.find((u) => u.id === 'sel-b')!.computedZIndex!;

      // Both selected, so sorted by zOrder: sel-a(1) before sel-b(3)
      expect(bZ).toBeGreaterThan(aZ);
    });
  });

  describe('independent child slot assignment', () => {
    it('should not inflate sibling position when child has high zOrder', () => {
      // group1 with child-high (zOrder=50) and child-normal (no zOrder).
      // child-high's jump to 50 should NOT push child-normal up.
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const childHigh = {
        ...mockNode,
        id: 'child-high',
        groupId: 'group1',
        zOrder: 50,
        computedZIndex: 0,
      };
      const childNormal = {
        ...mockNode,
        id: 'child-normal',
        groupId: 'group1',
        computedZIndex: 0,
      };

      nodesMap.set('group1', group1);
      nodesMap.set('child-high', childHigh);
      nodesMap.set('child-normal', childNormal);
      context.state.nodes = [group1, childHigh, childNormal];
      context.state.edges = [];
      context.modelActionTypes = ['init'];

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      // Sort by zOrder: childNormal(0) before childHigh(50)
      // childNormal: slot=1, nonElevatedZ=max(0,1)=1, computedZIndex=1
      // childHigh: slot=2, nonElevatedZ=max(50,2)=50, computedZIndex=50
      // Key: childNormal gets slot=1, NOT pushed up by childHigh's zOrder=50
      const normalZ = updates.find((u) => u.id === 'child-normal')!.computedZIndex!;
      const highZ = updates.find((u) => u.id === 'child-high')!.computedZIndex!;

      expect(normalZ).toBe(1);
      expect(highZ).toBe(50);
      expect(highZ).toBeGreaterThan(normalZ);
    });

    it('should not inflate parent-level sibling slots from deeply nested zOrder jump', () => {
      // group1 with groupA (contains child with zOrder=1000) and siblingB.
      // groupA's internal jump should not push siblingB up.
      const group1 = { ...mockNode, id: 'group1', isGroup: true, computedZIndex: 0 };
      const groupA = {
        ...mockNode,
        id: 'groupA',
        isGroup: true,
        groupId: 'group1',
        zOrder: 1,
        computedZIndex: 0,
      };
      const deepChild = {
        ...mockNode,
        id: 'deep-child',
        groupId: 'groupA',
        zOrder: 1000,
        computedZIndex: 0,
      };
      const siblingB = {
        ...mockNode,
        id: 'siblingB',
        groupId: 'group1',
        zOrder: 2,
        computedZIndex: 0,
      };

      // Insert group1's children in reverse zOrder to exercise sorting
      nodesMap.set('group1', group1);
      nodesMap.set('siblingB', siblingB);
      nodesMap.set('deep-child', deepChild);
      nodesMap.set('groupA', groupA);
      context.state.nodes = [group1, siblingB, deepChild, groupA];
      context.state.edges = [];
      context.modelActionTypes = ['init'];

      executeMiddleware();

      const stateUpdate = nextMock.mock.calls[0][0] as FlowStateUpdate;
      const updates = stateUpdate.nodesToUpdate || [];

      const groupAZ = updates.find((u) => u.id === 'groupA')!.computedZIndex!;
      const deepZ = updates.find((u) => u.id === 'deep-child')!.computedZIndex!;
      const siblingBZ = updates.find((u) => u.id === 'siblingB')!.computedZIndex!;

      // groupA: slot=1, zOrder=1 → nonElevatedZ=1, computedZIndex=1
      // deep-child: slot=2, zOrder=1000 → nonElevatedZ=1000, computedZIndex=1000
      // siblingB: slot=2 (independent from groupA's internals), zOrder=2 → nonElevatedZ=2, computedZIndex=2
      expect(groupAZ).toBe(1);
      expect(deepZ).toBe(1000);
      expect(siblingBZ).toBe(2);
      // siblingB is NOT pushed to 1001
      expect(siblingBZ).toBeLessThan(deepZ);
    });
  });
});
