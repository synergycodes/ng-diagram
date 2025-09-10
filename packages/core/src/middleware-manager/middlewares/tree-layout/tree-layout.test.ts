import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Edge, Metadata, MiddlewareContext, MiddlewaresConfigFromMiddlewares, Node } from '../../../types';
import type { MiddlewareExecutor } from '../../middleware-executor';
import { treeLayoutMiddleware } from './tree-layout';
import * as buildTreeModule from './utils/build-tree-structure';
import * as orientationModule from './utils/orientation-tree-layout';

type Helpers = ReturnType<MiddlewareExecutor<[], Metadata<MiddlewaresConfigFromMiddlewares<[]>>>['helpers']>;

// Mock the imported modules
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
    it('should have correct name', () => {
      expect(treeLayoutMiddleware.name).toBe('tree-layout');
    });

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
        ['1', { id: '1', position: { x: 50, y: 50 }, children: [] }],
        ['2', { id: '2', position: { x: 150, y: 50 }, children: [] }],
      ]);
      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);
      vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({
        roots: [{ id: '1', position: { x: 50, y: 50 }, children: [] }],
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

      const mockNodeMap = new Map([['1', { id: '1', position: { x: 50, y: 50 }, children: [] }]]);
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
        { id: 'root1', position: { x: 0, y: 0 }, children: [] },
        { id: 'root2', position: { x: 0, y: 0 }, children: [] },
      ];
      vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({ roots: mockRoots });

      // Horizontal layout - varies Y
      vi.mocked(orientationModule.makeTreeLayout)
        .mockReturnValueOnce({ minX: 0, maxX: 100, minY: 0, maxY: 50 })
        .mockReturnValueOnce({ minX: 0, maxX: 100, minY: 70, maxY: 120 });

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      // Should be called with increasing Y offsets for horizontal layout
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(mockRoots[0], expect.any(Object), 100, 100, 0);
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(
        mockRoots[1],
        expect.any(Object),
        100,
        170, // 100 + 50 (height) + 20 (gap)
        0
      );
    });

    it('should handle vertical layout (layoutAngle 90 or 270)', () => {
      context.modelActionType = 'treeLayout';
      context.flowCore.config!.treeLayout.layoutAngle = 90;

      const mockRoots = [
        { id: 'root1', position: { x: 0, y: 0 }, children: [] },
        { id: 'root2', position: { x: 0, y: 0 }, children: [] },
      ];
      vi.mocked(buildTreeModule.buildTreeStructure).mockReturnValue({ roots: mockRoots });

      // Vertical layout - varies X
      vi.mocked(orientationModule.makeTreeLayout)
        .mockReturnValueOnce({ minX: 0, maxX: 50, minY: 0, maxY: 100 })
        .mockReturnValueOnce({ minX: 70, maxX: 120, minY: 0, maxY: 100 });

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      // Should be called with increasing X offsets for vertical layout
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(mockRoots[0], expect.any(Object), 100, 100, 90);
      expect(orientationModule.makeTreeLayout).toHaveBeenCalledWith(
        mockRoots[1],
        expect.any(Object),
        170, // 100 + 50 (width) + 20 (gap)
        100,
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
        ['1', { id: '1', position: { x: 20, y: 20 }, children: [] }], // Changed
        ['2', { id: '2', position: { x: 50, y: 50 }, children: [] }], // Same
        ['3', { id: '3', position: { x: 100, y: 100 }, children: [] }], // Changed
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

    it('should skip nodes without position', () => {
      context.modelActionType = 'treeLayout';

      const mockNodes = [
        { id: '1', position: { x: 10, y: 10 }, type: 'node' },
        { id: '2', type: 'node' }, // No position
      ] as Node[];
      context.state.nodes = mockNodes;

      const mockNodeMap = new Map([
        ['1', { id: '1', position: { x: 20, y: 20 }, children: [] }],
        ['2', { id: '2', position: { x: 50, y: 50 }, children: [] }],
      ]);
      vi.mocked(buildTreeModule.getNodeMap).mockReturnValue(mockNodeMap);

      treeLayoutMiddleware.execute(context, nextMock, cancelMock);

      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [{ id: '1', position: { x: 20, y: 20 } }],
      });
    });
  });

  describe('group handling', () => {
    it('should build groups hierarchy', () => {
      context.modelActionType = 'treeLayout';

      const mockNodeMap = new Map([
        ['1', { id: '1', position: { x: 0, y: 0 }, type: 'group', children: [] }],
        ['2', { id: '2', position: { x: 0, y: 0 }, groupId: '1', children: [] }],
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
