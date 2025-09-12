import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockGroupNode, mockNode } from '../../test-utils';
import type { Metadata, MiddlewareContext, MiddlewaresConfigFromMiddlewares, Node } from '../../types';
import { groupChildrenChangeExtent, GroupChildrenChangeExtentMiddlewareMetadata } from './group-children-change-extent';

const mockCalculateGroupRect = vi.fn();
vi.mock('../../utils/group-size', () => ({
  calculateGroupRect: (...args: unknown[]) => mockCalculateGroupRect(...args),
}));

describe('groupChildrenChangeExtent Middleware', () => {
  let helpers: {
    checkIfAnyNodePropsChanged: ReturnType<typeof vi.fn>;
    getAffectedNodeIds: ReturnType<typeof vi.fn>;
  };
  let mockModelLookup: {
    nodesMap: Map<string, Node>;
  };
  let context: MiddlewareContext<
    [],
    Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
    GroupChildrenChangeExtentMiddlewareMetadata
  >;
  const nextMock = vi.fn();
  const cancelMock = vi.fn();

  beforeEach(() => {
    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
    };

    mockModelLookup = {
      nodesMap: new Map(),
    };

    context = {
      helpers: helpers as unknown as MiddlewareContext['helpers'],
      modelLookup: mockModelLookup,
      middlewareMetadata: {
        enabled: true,
      },
    } as unknown as MiddlewareContext<
      [],
      Metadata<MiddlewaresConfigFromMiddlewares<[]>>,
      GroupChildrenChangeExtentMiddlewareMetadata
    >;
    nextMock.mockReset();
    cancelMock.mockReset();
    mockCalculateGroupRect.mockReset();
  });

  it('should call next with no args if no groupId changes', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(false);

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should handle a single node being added to a group', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);

    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    mockModelLookup.nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

    mockCalculateGroupRect.mockReturnValue({ x: 10, y: 20, width: 100, height: 200 });

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

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

  it('should handle multiple nodes being added to the same group', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1', 'node2']);

    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    mockModelLookup.nodesMap.set('node2', { ...mockNode, id: 'node2', groupId: 'group1' });
    mockModelLookup.nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

    mockCalculateGroupRect.mockReturnValue({ x: 0, y: 0, width: 300, height: 400 });

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

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

  it('should handle nodes being added to different groups simultaneously', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1', 'node2']);

    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    mockModelLookup.nodesMap.set('node2', { ...mockNode, id: 'node2', groupId: 'group2' });
    mockModelLookup.nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });
    mockModelLookup.nodesMap.set('group2', { ...mockGroupNode, id: 'group2' });

    mockCalculateGroupRect
      .mockReturnValueOnce({ x: 10, y: 20, width: 100, height: 200 })
      .mockReturnValueOnce({ x: 30, y: 40, width: 150, height: 250 });

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

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

  it('should handle a node being removed from a group', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);

    // Node's groupId changed from 'group1' to undefined (removed from group)
    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: undefined });
    mockModelLookup.nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

    mockCalculateGroupRect.mockReturnValue({ x: 0, y: 0, width: 0, height: 0 });

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

    // Since the node was removed from the group, no updates should be needed
    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should handle a node being moved between groups', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);

    // Node's groupId changed from 'group1' to 'group2'
    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group2' });
    mockModelLookup.nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });
    mockModelLookup.nodesMap.set('group2', { ...mockGroupNode, id: 'group2' });

    mockCalculateGroupRect.mockReturnValue({ x: 15, y: 25, width: 120, height: 220 });

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group2',
          position: { x: 15, y: 25 },
          size: { width: 120, height: 220 },
          autoSize: false,
        },
      ],
    });
  });

  it('should handle non-existent group IDs gracefully', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);

    // Node references a group that doesn't exist
    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'nonexistent-group' });

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should handle invalid group nodes gracefully', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1']);

    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' });
    // Group node exists but is not a valid group node
    mockModelLookup.nodesMap.set('group1', { ...mockNode, id: 'group1' }); // Not a group node

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });

  it('should handle multiple nodes with mixed valid and invalid group IDs', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['node1', 'node2', 'node3']);

    mockModelLookup.nodesMap.set('node1', { ...mockNode, id: 'node1', groupId: 'group1' }); // Valid group
    mockModelLookup.nodesMap.set('node2', { ...mockNode, id: 'node2', groupId: 'nonexistent' }); // Invalid group
    mockModelLookup.nodesMap.set('node3', { ...mockNode, id: 'node3', groupId: 'group1' }); // Valid group
    mockModelLookup.nodesMap.set('group1', { ...mockGroupNode, id: 'group1' });

    mockCalculateGroupRect.mockReturnValue({ x: 5, y: 15, width: 250, height: 350 });

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith({
      nodesToUpdate: [
        {
          id: 'group1',
          position: { x: 5, y: 15 },
          size: { width: 250, height: 350 },
          autoSize: false,
        },
      ],
    });
  });

  it('should handle non-existent nodes gracefully', () => {
    helpers.checkIfAnyNodePropsChanged.mockReturnValue(true);
    helpers.getAffectedNodeIds.mockReturnValue(['nonexistent1', 'nonexistent2']);

    groupChildrenChangeExtent.execute(context, nextMock, cancelMock);

    expect(nextMock).toHaveBeenCalledWith();
  });
});
