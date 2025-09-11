import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, Metadata, MiddlewareContext, MiddlewaresConfigFromMiddlewares, Node } from '../../../types';
import type { MiddlewareExecutor } from '../../middleware-executor';
import { treeLayoutMiddleware } from './tree-layout';
import * as buildTreeModule from './utils/build-tree-structure';
import * as orientationModule from './utils/orientation-tree-layout';

type Helpers = ReturnType<MiddlewareExecutor<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>>['helpers']>;

vi.mock('./utils/build-tree-structure');
vi.mock('./utils/orientation-tree-layout');

describe('treeLayoutMiddleware', () => {
  let helpers: Partial<Helpers>;
  let nodesMap: Map<string, Node>;
  let edgesMap: Map<string, Edge>;
  let context: MiddlewareContext<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>>;
  let nextMock: ReturnType<typeof vi.fn>;
  let cancelMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    helpers = {
      anyEdgesAdded: vi.fn().mockReturnValue(false),
      anyEdgesRemoved: vi.fn().mockReturnValue(false),
      checkIfAnyNodePropsChanged: vi.fn().mockReturnValue(false),
    };

    nodesMap = new Map();
    edgesMap = new Map();
    nextMock = vi.fn();
    cancelMock = vi.fn();

    context = {
      initialState: {
        nodes: [],
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1 },
          middlewaresConfig: {},
        } as Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      },
      state: {
        nodes: [],
        edges: [],
        metadata: {
          viewport: { x: 0, y: 0, scale: 1 },
          middlewaresConfig: {},
        } as Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      },
      nodesMap,
      edgesMap,
      modelActionType: 'update',
      flowCore: {
        config: {
          treeLayout: {
            getLayoutAngleForNode: () => null,
            getLayoutAlignmentForNode: () => null,
            siblingGap: 20,
            levelGap: 30,
            autoLayout: false,
            layoutAngle: 90,
            layoutAlignment: 'parent',
            treeGap: 100,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      helpers: helpers as Helpers,
      history: [],
      initialUpdate: {},
      middlewareMetadata: undefined,
    } as unknown as MiddlewareContext<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>>;

    // Setup default mock implementations
    vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(new Map());
    vi.mocked(buildTreeModule.buildTopGroupMap).mockReturnValue(new Map());
    vi.mocked(buildTreeModule.remapEdges).mockReturnValue([]);
    vi.mocked(buildTreeModule.buildGroupsHierarchy).mockReturnValue([]);
    vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({ roots: [] });
    vi.mocked(orientationModule.makeTreeLayout).mockReturnValue({
      minX: 0,
      maxX: 100,
      minY: 0,
      maxY: 100,
    });
  });

  describe('middleware configuration', () => {
    it('should be a middleware object with execute function', () => {
      expect(treeLayoutMiddleware).toHaveProperty('execute');
      expect(typeof treeLayoutMiddleware.execute).toBe('function');
    });
  });

  describe('when config is not available', () => {
    it('should call next and return early when config is null', () => {
      const contextWithNullConfig = {
        ...context,
        flowCore: {
          config: { treeLayout: null },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      treeLayoutMiddleware.execute(contextWithNullConfig as any, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
      expect(buildTreeModule.getNodeMap).not.toHaveBeenCalled();
    });

    it('should call next and return early when config is undefined', () => {
      const contextWithoutConfig = {
        ...context,
        flowCore: {
          config: {},
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      treeLayoutMiddleware.execute(contextWithoutConfig as any, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
      expect(buildTreeModule.getNodeMap).not.toHaveBeenCalled();
    });
  });

  describe('manual tree layout trigger', () => {
    it('should perform layout when modelActionType is treeLayout', () => {
      context.modelActionType = 'treeLayout';

      const mockNodes = [
        { id: '1', position: { x: 0, y: 0 }, type: 'node' },
        { id: '2', position: { x: 100, y: 0 }, type: 'node' },
      ] as Node[];
      context.state.nodes = mockNodes;

      const mockNodeMap = new Map([
        ['1', { id: '1', position: { x: 50, y: 50 }, children: [], isGroup: false }],
        ['2', { id: '2', position: { x: 150, y: 50 }, children: [], isGroup: false }],
      ]);
      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);
      vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({
        roots: [{ id: '1', position: { x: 50, y: 50 }, children: [], isGroup: false }],
      });

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(buildTreeModule.getNodeMap).toHaveBeenCalledWith(context.flowCore.config.treeLayout, context.state.nodes);
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          { id: '1', position: { x: 50, y: 50 } },
          { id: '2', position: { x: 150, y: 50 } },
        ],
      });
    });

    it('should call next with empty object when no nodes need updating', () => {
      context.modelActionType = 'treeLayout';

      const mockNodes = [{ id: '1', position: { x: 50, y: 50 }, type: 'node' }] as Node[];
      context.state.nodes = mockNodes;

      const mockNodeMap = new Map([['1', { id: '1', position: { x: 50, y: 50 }, children: [], isGroup: false }]]);
      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });
  });

  describe('auto layout triggers', () => {
    beforeEach(() => {
      context.flowCore.config!.treeLayout.autoLayout = true;
    });

    it('should trigger on init when autoLayout is true', () => {
      context.modelActionType = 'init';
      context.flowCore.config!.treeLayout.autoLayout = true;

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(buildTreeModule.getNodeMap).toHaveBeenCalled();
    });

    it('should trigger when edges are added and autoLayout is true', () => {
      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      context.flowCore.config!.treeLayout.autoLayout = true;

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(buildTreeModule.getNodeMap).toHaveBeenCalled();
    });

    it('should trigger when edges are removed and autoLayout is true', () => {
      context.helpers.anyEdgesRemoved = vi.fn().mockReturnValue(true);
      context.flowCore.config!.treeLayout.autoLayout = true;

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(buildTreeModule.getNodeMap).toHaveBeenCalled();
    });

    it('should trigger when node position or size changes and autoLayout is true', () => {
      context.helpers.checkIfAnyNodePropsChanged = vi.fn().mockReturnValue(true);
      context.flowCore.config!.treeLayout.autoLayout = true;

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(context.helpers.checkIfAnyNodePropsChanged).toHaveBeenCalledWith(['position', 'size']);
      expect(buildTreeModule.getNodeMap).toHaveBeenCalled();
    });

    it('should not trigger auto layout when autoLayout is false', () => {
      context.helpers.anyEdgesAdded = vi.fn().mockReturnValue(true);
      // autoLayout is false in raw config, so it should bail out early
      context.flowCore.config!.treeLayout.autoLayout = false;

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
      expect(buildTreeModule.getNodeMap).not.toHaveBeenCalled();
    });
  });

  describe('tree layout calculation', () => {
    it('should handle horizontal layout (layoutAngle 0 or 180)', () => {
      context.modelActionType = 'treeLayout';
      context.flowCore.config!.treeLayout.layoutAngle = 0;

      const mockRoots = [
        { id: 'root1', position: { x: 10, y: 20 }, children: [], isGroup: false },
        { id: 'root2', position: { x: 30, y: 40 }, children: [], isGroup: false },
      ];
      vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({ roots: mockRoots });

      // Horizontal layout - varies Y
      vi.mocked(orientationModule.makeTreeLayout)
        .mockReturnValueOnce({ minX: 10, maxX: 110, minY: 20, maxY: 70 })
        .mockReturnValueOnce({ minX: 10, maxX: 110, minY: 170, maxY: 220 });

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      // First root uses its own position
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(mockRoots[0], expect.any(Object), 10, 20, 0);
      // Second root: same X as first, Y = previous maxY + treeGap
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(
        mockRoots[1],
        expect.any(Object),
        10, // Same X as first root
        170, // 70 (previous maxY) + 100 (treeGap)
        0
      );
    });

    it('should handle vertical layout (layoutAngle 90 or 270)', () => {
      context.modelActionType = 'treeLayout';
      context.flowCore.config!.treeLayout.layoutAngle = 90;

      const mockRoots = [
        { id: 'root1', position: { x: 15, y: 25 }, children: [], isGroup: false },
        { id: 'root2', position: { x: 35, y: 45 }, children: [], isGroup: false },
      ];
      vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({ roots: mockRoots });

      // Vertical layout - varies X
      vi.mocked(orientationModule.makeTreeLayout)
        .mockReturnValueOnce({ minX: 15, maxX: 65, minY: 25, maxY: 125 })
        .mockReturnValueOnce({ minX: 165, maxX: 215, minY: 25, maxY: 125 });

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      // First root uses its own position
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(mockRoots[0], expect.any(Object), 15, 25, 90);
      // Second root: same Y as first, X = previous maxX + treeGap
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(
        mockRoots[1],
        expect.any(Object),
        165, // 65 (previous maxX) + 100 (treeGap)
        25, // Same Y as first root
        90
      );
    });
  });

  describe('node position updates', () => {
    it('should only update nodes that have changed position', () => {
      context.modelActionType = 'treeLayout';

      const mockNodes = [
        { id: '1', position: { x: 10, y: 10 }, type: 'node' },
        { id: '2', position: { x: 50, y: 50 }, type: 'node' }, // This one will not change
        { id: '3', position: { x: 90, y: 90 }, type: 'node' },
      ] as Node[];
      context.state.nodes = mockNodes;

      const mockNodeMap = new Map([
        ['1', { id: '1', position: { x: 20, y: 20 }, children: [], isGroup: false }], // Changed
        ['2', { id: '2', position: { x: 50, y: 50 }, children: [], isGroup: false }], // Same
        ['3', { id: '3', position: { x: 100, y: 100 }, children: [], isGroup: false }], // Changed
      ]);
      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          { id: '1', position: { x: 20, y: 20 } },
          { id: '3', position: { x: 100, y: 100 } },
        ],
      });
    });

    it('should position nodes without initial position', () => {
      context.modelActionType = 'treeLayout';

      const mockNodes = [
        { id: '1', position: { x: 10, y: 10 }, type: 'node' },
        { id: '2', type: 'node' }, // No position - should receive calculated position
      ] as Node[];
      context.state.nodes = mockNodes;

      const mockNodeMap = new Map([
        ['1', { id: '1', position: { x: 20, y: 20 }, children: [], isGroup: false }],
        ['2', { id: '2', position: { x: 50, y: 50 }, children: [], isGroup: false }],
      ]);
      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          { id: '1', position: { x: 20, y: 20 } },
          { id: '2', position: { x: 50, y: 50 } }, // Node without position gets positioned
        ],
      });
    });
  });

  describe('group handling', () => {
    it('should build groups hierarchy', () => {
      context.modelActionType = 'treeLayout';

      const mockNodeMap = new Map([
        ['1', { id: '1', position: { x: 0, y: 0 }, type: 'group', children: [], isGroup: true }],
        ['2', { id: '2', position: { x: 0, y: 0 }, groupId: '1', children: [], isGroup: false }],
      ]);
      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(buildTreeModule.buildGroupsHierarchy).toHaveBeenCalledWith(mockNodeMap);
    });

    it('should build top group map and remap edges', () => {
      context.modelActionType = 'treeLayout';

      const mockEdges = [{ source: 'node1', target: 'node2' }] as Edge[];
      context.state.edges = mockEdges;

      const mockNodeMap = new Map();
      const mockTopGroupMap = new Map([
        ['node1', 'group1'],
        ['node2', 'group2'],
      ]);

      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);
      vi.mocked(buildTreeModule.buildTopGroupMap).mockReturnValue(mockTopGroupMap);

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(buildTreeModule.buildTopGroupMap).toHaveBeenCalledWith(mockNodeMap);
      expect(buildTreeModule.remapEdges).toHaveBeenCalledWith(mockEdges, mockTopGroupMap);
    });
  });

  describe('edge cases', () => {
    it('should handle empty node list', () => {
      context.modelActionType = 'treeLayout';
      context.state.nodes = [];

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });

    it('should handle empty roots', () => {
      context.modelActionType = 'treeLayout';

      vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({ roots: [] });

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({});
    });

    it('should not perform layout for other action types when autoLayout is false', () => {
      context.modelActionType = 'updateNode';
      context.flowCore.config!.treeLayout.autoLayout = false;

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith();
      expect(buildTreeModule.getNodeMap).not.toHaveBeenCalled();
    });
  });
});
