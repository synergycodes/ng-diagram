import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGroupNode, mockNode } from '../../test-utils';
import type { MiddlewareContext, Node } from '../../types';
import { groupChildrenMoveExtent } from './group-children-move-extent';

const mockCalculateGroupRect = vi.fn();
vi.mock('../../utils/group-size', () => ({
  calculateGroupRect: (...args: unknown[]) => mockCalculateGroupRect(...args),
}));

describe('groupChildrenMoveExtent Middleware', () => {
  let helpers: {
    checkIfAnyNodePropsChanged: ReturnType<typeof vi.fn>;
    getAffectedNodeIds: ReturnType<typeof vi.fn>;
  };
  let nodesMap: Map<string, Node>;
  let mockModelLookup: {
    getParentChain: ReturnType<typeof vi.fn>;
    getNodeChildrenIds: ReturnType<typeof vi.fn>;
  };
  let mockActionStateManager: {
    dragging?: {
      modifiers: {
        shift: boolean;
        primary: boolean;
        secondary: boolean;
        meta: boolean;
      };
    };
  };
  let context: MiddlewareContext;
  const nextMock = vi.fn();
  const cancelMock = vi.fn();

  beforeEach(() => {
    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
    };

    nodesMap = new Map();
    mockModelLookup = {
      getParentChain: vi.fn().mockReturnValue([]),
      getNodeChildrenIds: vi.fn().mockReturnValue([]),
    };

    mockActionStateManager = {
      dragging: undefined,
    };

    context = {
      helpers: helpers as unknown as MiddlewareContext['helpers'],
      nodesMap,
      modelLookup: mockModelLookup,
      actionStateManager: mockActionStateManager,
      config: {
        grouping: {
          allowGroupAutoResize: true,
        },
      },
    } as unknown as MiddlewareContext;
    nextMock.mockReset();
    cancelMock.mockReset();
    mockCalculateGroupRect.mockReset();
  });

  it('should call next with no args if no relevant changes', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(false);

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should call next with no args if no affected groups', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, groupId: undefined });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should update a single group if affected', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });
    mockModelLookup.getParentChain.mockReturnValue([]);
    mockModelLookup.getNodeChildrenIds.mockReturnValue(['node1']);
    mockCalculateGroupRect.mockReturnValue({ x: 10, y: 20, width: 100, height: 200 });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 200 },
          autoSize: false,
        },
      ],
    });
  });

  it('should update ancestor groups as well', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1', groupId: 'group2' });
    nodesMap.set('group2', { ...mockGroupNode, id: 'group2' });
    mockModelLookup.getParentChain.mockReturnValue([nodesMap.get('group2')]);
    mockModelLookup.getNodeChildrenIds.mockImplementation((id: string) =>
      id === 'group1' ? ['node1'] : id === 'group2' ? ['group1'] : []
    );
    mockCalculateGroupRect
      .mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 })
      .mockReturnValueOnce({ x: 5, y: 10, width: 200, height: 400 });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 200 },
          autoSize: false,
        },
        {
          id: 'group2',
          position: { x: 5, y: 10 },
          size: { width: 200, height: 400 },
          autoSize: false,
        },
      ],
    });
  });

  it('should handle multiple affected nodes in the same group', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1', 'node2']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('node2', { ...mockNode, id: 'node2', groupId: 'group1' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });
    mockModelLookup.getParentChain.mockReturnValue([]);
    mockModelLookup.getNodeChildrenIds.mockReturnValue(['node1', 'node2']);
    mockCalculateGroupRect.mockReturnValue({ x: 0, y: 0, width: 300, height: 400 });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 0, y: 0 },
          size: { width: 300, height: 400 },
          autoSize: false,
        },
      ],
    });
  });

  it('should handle nodes in different groups being affected simultaneously', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1', 'node2']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('node2', { ...mockNode, id: 'node2', groupId: 'group2' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });
    nodesMap.set('group2', { ...mockGroupNode, id: 'group2' });
    mockModelLookup.getParentChain.mockReturnValue([]);
    mockModelLookup.getNodeChildrenIds.mockImplementation((id: string) =>
      id === 'group1' ? ['node1'] : id === 'group2' ? ['node2'] : []
    );
    mockCalculateGroupRect
      .mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 })
      .mockReturnValueOnce({ x: 30, y: 40, width: 150, height: 250 });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 200 },
          autoSize: false,
        },
        {
          id: 'group2',
          position: { x: 30, y: 40 },
          size: { width: 150, height: 250 },
          autoSize: false,
        },
      ],
    });
  });

  it('should handle deeply nested group hierarchy with multiple affected nodes', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1', 'node2']);

    // Create a deep hierarchy: node1 -> group1 -> group2 -> group3
    //                         node2 -> group1
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('node2', { ...mockNode, id: 'node2', groupId: 'group1' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1', groupId: 'group2' });
    nodesMap.set('group2', { ...mockGroupNode, id: 'group2', groupId: 'group3' });
    nodesMap.set('group3', { ...mockGroupNode, id: 'group3' });

    mockModelLookup.getParentChain.mockImplementation((id: string) => {
      if (id === 'group1') return [nodesMap.get('group2'), nodesMap.get('group3')];
      if (id === 'group2') return [nodesMap.get('group3')];
      return [];
    });

    mockModelLookup.getNodeChildrenIds.mockImplementation((id: string) => {
      switch (id) {
        case 'group1':
          return ['node1', 'node2'];
        case 'group2':
          return ['group1'];
        case 'group3':
          return ['group2'];
        default:
          return [];
      }
    });

    mockCalculateGroupRect
      .mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 })
      .mockReturnValueOnce({ x: 5, y: 10, width: 200, height: 400 })
      .mockReturnValueOnce({ x: 0, y: 0, width: 300, height: 600 });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 200 },
          autoSize: false,
        },
        {
          id: 'group2',
          position: { x: 5, y: 10 },
          size: { width: 200, height: 400 },
          autoSize: false,
        },
        {
          id: 'group3',
          position: { x: 0, y: 0 },
          size: { width: 300, height: 600 },
          autoSize: false,
        },
      ],
    });
  });

  it('should handle circular group references gracefully', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);

    // Create a circular reference: node1 -> group1 -> group2 -> group1
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1', groupId: 'group2' });
    nodesMap.set('group2', { ...mockGroupNode, id: 'group2', groupId: 'group1' });

    mockModelLookup.getParentChain.mockImplementation((id: string) => {
      if (id === 'group1') return [nodesMap.get('group2')];
      if (id === 'group2') return [nodesMap.get('group1')];
      return [];
    });

    mockModelLookup.getNodeChildrenIds.mockImplementation((id: string) => {
      switch (id) {
        case 'group1':
          return ['node1'];
        case 'group2':
          return ['group1'];
        default:
          return [];
      }
    });

    mockCalculateGroupRect
      .mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 })
      .mockReturnValueOnce({ x: 5, y: 10, width: 200, height: 400 });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    // Even with circular references, each group should only be updated once
    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 200 },
          autoSize: false,
        },
        {
          id: 'group2',
          position: { x: 5, y: 10 },
          size: { width: 200, height: 400 },
          autoSize: false,
        },
      ],
    });
  });

  it('should handle empty groups', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1', groupId: 'group2' });
    nodesMap.set('group2', { ...mockGroupNode, id: 'group2' });

    mockModelLookup.getParentChain.mockReturnValue([nodesMap.get('group2')]);
    mockModelLookup.getNodeChildrenIds.mockImplementation((id: string) => {
      switch (id) {
        case 'group1':
          return ['node1'];
        case 'group2':
          return []; // Empty group
        default:
          return [];
      }
    });

    mockCalculateGroupRect.mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 });

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 200 },
          autoSize: false,
        },
      ],
    });
  });

  describe('shift modifier behavior', () => {
    it('should skip extent updates when shift is held during dragging', () => {
      helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
      helpers.getAffectedNodeIds.mockReturnValue(['node1']);
      nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
      nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

      // Set shift modifier to true
      mockActionStateManager.dragging = {
        modifiers: {
          shift: true,
          primary: false,
          secondary: false,
          meta: false,
        },
      };

      mockModelLookup.getParentChain.mockReturnValue([]);
      mockModelLookup.getNodeChildrenIds.mockReturnValue(['node1']);
      mockCalculateGroupRect.mockReturnValue({ x: 10, y: 20, width: 100, height: 200 });

      groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

      // Should call next without updates when shift is held
      expect(nextMock).toHaveBeenCalledWith();
      expect(mockCalculateGroupRect).not.toHaveBeenCalled();
    });

    it('should apply extent updates when shift is not held', () => {
      helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
      helpers.getAffectedNodeIds.mockReturnValue(['node1']);
      nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
      nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

      // Set shift modifier to false
      mockActionStateManager.dragging = {
        modifiers: {
          shift: false,
          primary: false,
          secondary: false,
          meta: false,
        },
      };

      mockModelLookup.getParentChain.mockReturnValue([]);
      mockModelLookup.getNodeChildrenIds.mockReturnValue(['node1']);
      mockCalculateGroupRect.mockReturnValue({ x: 10, y: 20, width: 100, height: 200 });

      groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

      // Should apply updates when shift is not held
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          {
            id: 'group1',
            position: { x: 10, y: 20 },
            size: { width: 100, height: 200 },
            autoSize: false,
          },
        ],
      });
    });

    it('should apply extent updates when dragging state is undefined', () => {
      helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
      helpers.getAffectedNodeIds.mockReturnValue(['node1']);
      nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
      nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

      // No dragging state
      mockActionStateManager.dragging = undefined;

      mockModelLookup.getParentChain.mockReturnValue([]);
      mockModelLookup.getNodeChildrenIds.mockReturnValue(['node1']);
      mockCalculateGroupRect.mockReturnValue({ x: 10, y: 20, width: 100, height: 200 });

      groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

      // Should apply updates when not dragging
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          {
            id: 'group1',
            position: { x: 10, y: 20 },
            size: { width: 100, height: 200 },
            autoSize: false,
          },
        ],
      });
    });

    it('should handle other modifiers without affecting extent behavior', () => {
      helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
      helpers.getAffectedNodeIds.mockReturnValue(['node1']);
      nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
      nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

      // Other modifiers set but not shift
      mockActionStateManager.dragging = {
        modifiers: {
          shift: false,
          primary: true,
          secondary: true,
          meta: true,
        },
      };

      mockModelLookup.getParentChain.mockReturnValue([]);
      mockModelLookup.getNodeChildrenIds.mockReturnValue(['node1']);
      mockCalculateGroupRect.mockReturnValue({ x: 10, y: 20, width: 100, height: 200 });

      groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

      // Should apply updates when shift is not held (other modifiers don't matter)
      expect(nextMock).toHaveBeenCalledWith({
        nodesToUpdate: [
          {
            id: 'group1',
            position: { x: 10, y: 20 },
            size: { width: 100, height: 200 },
            autoSize: false,
          },
        ],
      });
    });

    it('should skip extent updates for nested groups when shift is held', () => {
      helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
      helpers.getAffectedNodeIds.mockReturnValue(['node1']);

      // Create nested structure
      nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
      nodesMap.set('group1', { ...mockGroupNode, id: 'group1', groupId: 'group2' });
      nodesMap.set('group2', { ...mockGroupNode, id: 'group2' });

      // Set shift modifier to true
      mockActionStateManager.dragging = {
        modifiers: {
          shift: true,
          primary: false,
          secondary: false,
          meta: false,
        },
      };

      mockModelLookup.getParentChain.mockReturnValue([nodesMap.get('group2')]);
      mockModelLookup.getNodeChildrenIds.mockImplementation((id: string) =>
        id === 'group1' ? ['node1'] : id === 'group2' ? ['group1'] : []
      );
      mockCalculateGroupRect
        .mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 })
        .mockReturnValueOnce({ x: 5, y: 10, width: 200, height: 400 });

      groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

      // Should skip all updates when shift is held
      expect(nextMock).toHaveBeenCalledWith();
      expect(mockCalculateGroupRect).not.toHaveBeenCalled();
    });
  });

  it('should handle groups with z-order sorting', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1', 'node2']);

    // Create groups with different z-orders
    nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    nodesMap.set('node2', { ...mockNode, id: 'node2', groupId: 'group2' });
    nodesMap.set('group1', { ...mockGroupNode, id: 'group1', zOrder: 2 });
    nodesMap.set('group2', { ...mockGroupNode, id: 'group2', zOrder: 1 });

    mockModelLookup.getParentChain.mockReturnValue([]);
    mockModelLookup.getNodeChildrenIds.mockImplementation((id: string) =>
      id === 'group1' ? ['node1'] : id === 'group2' ? ['node2'] : []
    );

    mockCalculateGroupRect
      .mockReturnValueOnce({ x: 30, y: 40, width: 150, height: 250 }) // group2 (lower z-order)
      .mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 }); // group1 (higher z-order)

    groupChildrenMoveExtent.execute(context, nextMock, cancelMock);

    // Groups should be processed in z-order
    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group2',
          position: { x: 30, y: 40 },
          size: { width: 150, height: 250 },
          autoSize: false,
        },
        {
          id: 'group1',
          position: { x: 10, y: 20 },
          size: { width: 100, height: 200 },
          autoSize: false,
        },
      ],
    });
  });
});
