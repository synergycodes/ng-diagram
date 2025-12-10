import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { GroupMembershipChangedEvent } from '../../../../../event-manager/event-types';
import { mockNode } from '../../../../../test-utils';
import type { GroupNode, MiddlewareContext, Node } from '../../../../../types';
import { GroupMembershipChangedEmitter } from '../group-membership-changed.emitter';

describe('GroupMembershipChangedEmitter', () => {
  let emitter: GroupMembershipChangedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;
  let helpers: MiddlewareContext['helpers'];

  beforeEach(() => {
    emitter = new GroupMembershipChangedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    helpers = {
      checkIfAnyNodePropsChanged: vi.fn(),
      getAffectedNodeIds: vi.fn(),
    } as unknown as MiddlewareContext['helpers'];

    context = {
      modelActionType: 'updateNodes',
      modelActionTypes: ['updateNodes'],
      initialNodesMap: new Map<string, Node>(),
      nodesMap: new Map<string, Node>(),
      helpers,
    } as unknown as MiddlewareContext;
  });

  describe('modelActionType filtering', () => {
    it('should not emit event when modelActionType is not updateNodes', () => {
      context.modelActionTypes = ['moveNodes'];
      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should check for groupId changes when modelActionType is updateNodes', () => {
      context.modelActionTypes = ['updateNodes'];
      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(false);

      emitter.emit(context, eventManager);

      expect(helpers.checkIfAnyNodePropsChanged).toHaveBeenCalledWith(['groupId']);
    });
  });

  describe('early exit optimization', () => {
    it('should not emit event when no groupId changes detected', () => {
      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(false);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
      expect(helpers.getAffectedNodeIds).not.toHaveBeenCalled();
    });

    it('should query affected nodes only when groupId changes detected', () => {
      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue([]);

      emitter.emit(context, eventManager);

      expect(helpers.getAffectedNodeIds).toHaveBeenCalledWith(['groupId']);
    });
  });

  describe('grouping nodes', () => {
    it('should emit event when node is added to a group', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const groupedNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const targetGroup: GroupNode = { ...mockNode, id: 'group1', isGroup: true } as GroupNode;

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', groupedNode);
      context.nodesMap.set('group1', targetGroup);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [{ nodes: [groupedNode], targetGroup }],
        ungrouped: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });

    it('should emit event when multiple nodes are added to same group', () => {
      const initialNode1: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const initialNode2: Node = { ...mockNode, id: 'node2', groupId: undefined };
      const groupedNode1: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const groupedNode2: Node = { ...mockNode, id: 'node2', groupId: 'group1' };
      const targetGroup: GroupNode = { ...mockNode, id: 'group1', isGroup: true } as GroupNode;

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1', 'node2']);

      context.initialNodesMap.set('node1', initialNode1);
      context.initialNodesMap.set('node2', initialNode2);
      context.nodesMap.set('node1', groupedNode1);
      context.nodesMap.set('node2', groupedNode2);
      context.nodesMap.set('group1', targetGroup);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [{ nodes: [groupedNode1, groupedNode2], targetGroup }],
        ungrouped: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });

    it('should emit single event when nodes are added to different groups', () => {
      const initialNode1: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const initialNode2: Node = { ...mockNode, id: 'node2', groupId: undefined };
      const groupedNode1: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const groupedNode2: Node = { ...mockNode, id: 'node2', groupId: 'group2' };
      const targetGroup1: GroupNode = { ...mockNode, id: 'group1', isGroup: true } as GroupNode;
      const targetGroup2: GroupNode = { ...mockNode, id: 'group2', isGroup: true } as GroupNode;

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1', 'node2']);

      context.initialNodesMap.set('node1', initialNode1);
      context.initialNodesMap.set('node2', initialNode2);
      context.nodesMap.set('node1', groupedNode1);
      context.nodesMap.set('node2', groupedNode2);
      context.nodesMap.set('group1', targetGroup1);
      context.nodesMap.set('group2', targetGroup2);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [
          { nodes: [groupedNode1], targetGroup: targetGroup1 },
          { nodes: [groupedNode2], targetGroup: targetGroup2 },
        ],
        ungrouped: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });

    it('should not emit event for grouping when target group is not found', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const groupedNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', groupedNode);
      // group1 not in nodesMap

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit event for grouping when target is not a group node', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const groupedNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const notAGroup = { ...mockNode, id: 'group1', isGroup: false } as unknown as Node;

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', groupedNode);
      context.nodesMap.set('group1', notAGroup);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should handle node moving from one group to another', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const regroupedNode: Node = { ...mockNode, id: 'node1', groupId: 'group2' };
      const targetGroup2: GroupNode = { ...mockNode, id: 'group2', isGroup: true } as GroupNode;

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', regroupedNode);
      context.nodesMap.set('group2', targetGroup2);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [{ nodes: [regroupedNode], targetGroup: targetGroup2 }],
        ungrouped: [],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });
  });

  describe('ungrouping nodes', () => {
    it('should emit event when node is removed from a group', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const ungroupedNode: Node = { ...mockNode, id: 'node1', groupId: undefined };

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', ungroupedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [],
        ungrouped: [ungroupedNode],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });

    it('should emit event when multiple nodes are removed from groups', () => {
      const initialNode1: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const initialNode2: Node = { ...mockNode, id: 'node2', groupId: 'group1' };
      const ungroupedNode1: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const ungroupedNode2: Node = { ...mockNode, id: 'node2', groupId: undefined };

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1', 'node2']);

      context.initialNodesMap.set('node1', initialNode1);
      context.initialNodesMap.set('node2', initialNode2);
      context.nodesMap.set('node1', ungroupedNode1);
      context.nodesMap.set('node2', ungroupedNode2);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [],
        ungrouped: [ungroupedNode1, ungroupedNode2],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });

    it('should handle groupId cleared as ungrouping', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const ungroupedNode: Node = { ...mockNode, id: 'node1', groupId: undefined };

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', ungroupedNode);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [],
        ungrouped: [ungroupedNode],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });
  });

  describe('mixed operations', () => {
    it('should emit single event with both grouped and ungrouped nodes', () => {
      const initialNode1: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const initialNode2: Node = { ...mockNode, id: 'node2', groupId: 'group1' };
      const groupedNode: Node = { ...mockNode, id: 'node1', groupId: 'group2' };
      const ungroupedNode: Node = { ...mockNode, id: 'node2', groupId: undefined };
      const targetGroup: GroupNode = { ...mockNode, id: 'group2', isGroup: true } as GroupNode;

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1', 'node2']);

      context.initialNodesMap.set('node1', initialNode1);
      context.initialNodesMap.set('node2', initialNode2);
      context.nodesMap.set('node1', groupedNode);
      context.nodesMap.set('node2', ungroupedNode);
      context.nodesMap.set('group2', targetGroup);

      emitter.emit(context, eventManager);

      const expectedEvent: GroupMembershipChangedEvent = {
        grouped: [{ nodes: [groupedNode], targetGroup }],
        ungrouped: [ungroupedNode],
      };

      expect(emitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).toHaveBeenCalledWith('groupMembershipChanged', expectedEvent);
    });
  });

  describe('edge cases', () => {
    it('should skip nodes not found in initialNodesMap', () => {
      const groupedNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const targetGroup: GroupNode = { ...mockNode, id: 'group1', isGroup: true } as GroupNode;

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      // Don't add to initialNodesMap
      context.nodesMap.set('node1', groupedNode);
      context.nodesMap.set('group1', targetGroup);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should skip nodes not found in current nodesMap', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: undefined };

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      // Don't add to nodesMap

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when groupId remains undefined', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: undefined };
      const currentNode: Node = { ...mockNode, id: 'node1', groupId: undefined };

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', currentNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when groupId remains the same', () => {
      const initialNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };
      const currentNode: Node = { ...mockNode, id: 'node1', groupId: 'group1' };

      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue(['node1']);

      context.initialNodesMap.set('node1', initialNode);
      context.nodesMap.set('node1', currentNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit when no affected nodes', () => {
      vi.mocked(helpers.checkIfAnyNodePropsChanged).mockReturnValue(true);
      vi.mocked(helpers.getAffectedNodeIds).mockReturnValue([]);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
