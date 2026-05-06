import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../../types';
import { bringToFront, sendToBack } from '../z-order';

describe('Z-order commands', () => {
  let commandHandler: CommandHandler;
  let flowCore: FlowCore;
  let mockGetState: Mock;

  beforeEach(() => {
    mockGetState = vi.fn();
    flowCore = {
      getState: mockGetState,
      applyUpdate: vi.fn(),
      config: { zIndex: { selectedZIndex: 1000, elevateOnSelection: true } },
    } as unknown as FlowCore;
    commandHandler = { flowCore } as CommandHandler;
  });

  function getNodeUpdates(): { id: string; zOrder: number }[] {
    return (flowCore.applyUpdate as Mock).mock.calls[0]?.[0]?.nodesToUpdate ?? [];
  }

  function getEdgeUpdates(): { id: string; zOrder: number }[] {
    return (flowCore.applyUpdate as Mock).mock.calls[0]?.[0]?.edgesToUpdate ?? [];
  }

  describe('bringToFront — targeting', () => {
    it('should not update if there is no target for the command', () => {
      const nodes = [
        { id: '1', selected: false, zOrder: 1 },
        { id: '2', selected: false, zOrder: 2 },
      ];
      const edges = [
        { id: '1', selected: false, zOrder: 1 },
        { id: '2', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, { name: 'bringToFront' });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should target current selection when no IDs provided', () => {
      const nodes = [
        { id: '1', selected: true, zOrder: 1 },
        { id: '2', selected: false, zOrder: 2 },
      ];
      const edges = [
        { id: 'e1', selected: true, zOrder: 1 },
        { id: 'e2', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, { name: 'bringToFront' });

      expect(getNodeUpdates().find((n) => n.id === '1')).toBeDefined();
      expect(getEdgeUpdates().find((e) => e.id === 'e1')).toBeDefined();
    });

    it('should target specific nodes and edges when IDs provided', () => {
      const nodes = [
        { id: '1', selected: false },
        { id: '2', selected: false },
      ];
      const edges = [
        { id: 'e1', selected: false },
        { id: 'e2', selected: false },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['1'], edgeIds: ['e1'] });

      expect(getNodeUpdates().map((n) => n.id)).toEqual(['1']);
      expect(getEdgeUpdates().map((e) => e.id)).toEqual(['e1']);
    });

    it('should not include nodes when only edges targeted', () => {
      const nodes = [{ id: '1', selected: false }];
      const edges = [{ id: 'e1', selected: false }];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, { name: 'bringToFront', edgeIds: ['e1'] });

      expect(getNodeUpdates()).toHaveLength(0);
      expect(getEdgeUpdates()).toHaveLength(1);
    });

    it('should not include edges when only nodes targeted', () => {
      const nodes = [{ id: '1', selected: false }];
      const edges = [{ id: 'e1', selected: false }];
      mockGetState.mockReturnValue({ nodes, edges });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['1'] });

      expect(getNodeUpdates()).toHaveLength(1);
      expect(getEdgeUpdates()).toHaveLength(0);
    });
  });

  describe('bringToFront — z-index calculation', () => {
    it('should compute base z-indices ignoring selection and computedZIndex', () => {
      const nodes = [
        { id: '1', selected: true, computedZIndex: 1000 },
        { id: '2', selected: false, computedZIndex: 0 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['2'] });

      // Both recomputed to base 0. Exclude node2. max=0. zOrder=1
      expect(getNodeUpdates()[0].zOrder).toBe(1);
    });

    it('should use zOrder for base computation', () => {
      const nodes = [
        { id: '1', zOrder: 5 },
        { id: '2', selected: false },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['2'] });

      // node1 base=5. Exclude node2. max=5. zOrder=6
      expect(getNodeUpdates()[0].zOrder).toBe(6);
    });

    it('should not let selection influence base z-index or sibling ordering', () => {
      const nodes = [
        { id: 'group1', selected: false, isGroup: true },
        // selected sibling listed first with lower zOrder — selection must NOT push it last
        { id: 'sel', selected: true, groupId: 'group1', zOrder: 1 },
        { id: 'nosel', selected: false, groupId: 'group1', zOrder: 5 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['sel'] });

      // Base z-indices computed ignoring selection:
      // sorted by zOrder only: sel(1) slot 1 → base=1, nosel(5) slot 2 → base=5
      // Exclude sel + descendants. Remaining: group1=0, nosel=5. max=5. zOrder=6
      expect(getNodeUpdates().find((n) => n.id === 'sel')!.zOrder).toBe(6);
    });

    it('should produce same zOrder regardless of target selection state', () => {
      const makeNodes = (selState: boolean) => [
        { id: 'group1', selected: false, isGroup: true },
        { id: 'target', selected: selState, groupId: 'group1', zOrder: 1 },
        { id: 'sibling', selected: false, groupId: 'group1', zOrder: 5 },
      ];

      // bringToFront with target selected
      mockGetState.mockReturnValue({ nodes: makeNodes(true), edges: [] });
      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['target'] });
      const zOrderSelected = getNodeUpdates().find((n) => n.id === 'target')!.zOrder;

      // Reset and bringToFront with target NOT selected
      (flowCore.applyUpdate as ReturnType<typeof vi.fn>).mockClear();
      mockGetState.mockReturnValue({ nodes: makeNodes(false), edges: [] });
      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['target'] });
      const zOrderNotSelected = getNodeUpdates().find((n) => n.id === 'target')!.zOrder;

      expect(zOrderSelected).toBe(zOrderNotSelected);
    });

    it('should exclude target + descendants from max calculation', () => {
      const nodes = [
        { id: 'group1', selected: false, isGroup: true },
        { id: 'child1', selected: false, groupId: 'group1' },
        { id: 'child2', selected: false, groupId: 'group1', zOrder: 10 },
        { id: 'other', selected: false, zOrder: 2 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['group1'] });

      // Exclude group1, child1, child2. Only 'other' at base=2. max=2. zOrder=3
      expect(getNodeUpdates().find((n) => n.id === 'group1')!.zOrder).toBe(3);
    });

    it('should apply same zOrder to multiple root targets', () => {
      const nodes = [
        { id: '1', selected: false },
        { id: '2', selected: false },
        { id: '3', selected: false, zOrder: 5 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['1', '2'] });

      // Exclude 1 and 2. max=5. zOrder=6. Both root targets get 6
      const updates = getNodeUpdates();
      expect(updates.find((n) => n.id === '1')!.zOrder).toBe(6);
      expect(updates.find((n) => n.id === '2')!.zOrder).toBe(6);
    });

    it('should apply incrementing zOrder to descendants preserving hierarchy order', () => {
      // child2 (high zOrder) listed BEFORE child1 (no zOrder) in array
      // to ensure sorting, not array order, determines the result
      const nodes = [
        { id: 'group1', selected: false, isGroup: true },
        { id: 'child2', selected: false, groupId: 'group1', zOrder: 5 },
        { id: 'child1', selected: false, groupId: 'group1' },
        { id: 'other', selected: false, zOrder: 2 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['group1'] });

      const updates = getNodeUpdates();
      const groupZ = updates.find((n) => n.id === 'group1')!.zOrder;
      const child1Z = updates.find((n) => n.id === 'child1')!.zOrder;
      const child2Z = updates.find((n) => n.id === 'child2')!.zOrder;
      // child1 (zOrder=0) sorted before child2 (zOrder=5) regardless of array order
      expect(child1Z).toBeGreaterThan(groupZ);
      expect(child2Z).toBeGreaterThan(child1Z);
    });

    it('should filter children of targeted groups from root targets (deep hierarchy)', () => {
      // Reverse hierarchy order in array to test that sorting handles it
      const nodes = [
        { id: 'leaf', selected: true, groupId: 'mid' },
        { id: 'mid', selected: true, isGroup: true, groupId: 'root' },
        { id: 'root', selected: true, isGroup: true },
        { id: 'other', selected: false, zOrder: 5 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront' });

      // root is the only root target. mid and leaf are descendants
      const updates = getNodeUpdates();
      const rootZ = updates.find((n) => n.id === 'root')!.zOrder;
      const midZ = updates.find((n) => n.id === 'mid')!.zOrder;
      const leafZ = updates.find((n) => n.id === 'leaf')!.zOrder;
      expect(rootZ).toBe(6); // max=5, +1
      expect(midZ).toBeGreaterThan(rootZ);
      expect(leafZ).toBeGreaterThan(midZ);
    });

    it('should handle deeply nested bringToFront — node above parent sibling', () => {
      // node1 listed before group2/node2 to ensure hierarchy, not array order, matters
      const nodes = [
        { id: 'node1', selected: false, groupId: 'group1' },
        { id: 'group1', selected: false, isGroup: true },
        { id: 'node2', selected: false, groupId: 'group2' },
        { id: 'group2', selected: false, isGroup: true, groupId: 'group1' },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['node2'] });

      const updates = getNodeUpdates();
      const node2Z = updates.find((n) => n.id === 'node2')!.zOrder;
      // node2's zOrder should be above everything (max base + 1)
      expect(node2Z).toBeGreaterThan(0);
    });
  });

  describe('sendToBack — targeting', () => {
    it('should not update if there is no target', () => {
      const nodes = [{ id: '1', selected: false, zOrder: 1 }];
      const edges = [{ id: 'e1', selected: false, zOrder: 1 }];
      mockGetState.mockReturnValue({ nodes, edges });

      sendToBack(commandHandler, { name: 'sendToBack' });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should target current selection when no IDs provided', () => {
      const nodes = [
        { id: '1', selected: true, zOrder: 1 },
        { id: '2', selected: false, zOrder: 2 },
      ];
      const edges = [
        { id: 'e1', selected: true, zOrder: 1 },
        { id: 'e2', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      sendToBack(commandHandler, { name: 'sendToBack' });

      expect(getNodeUpdates().find((n) => n.id === '1')).toBeDefined();
      expect(getEdgeUpdates().find((e) => e.id === 'e1')).toBeDefined();
    });

    it('should exclude target edge from min calculation', () => {
      const nodes = [{ id: '1', selected: false, zOrder: 3 }];
      const edges = [
        { id: 'e1', selected: false, zOrder: -10 },
        { id: 'e2', selected: false, zOrder: 2 },
      ];
      mockGetState.mockReturnValue({ nodes, edges });

      sendToBack(commandHandler, { name: 'sendToBack', edgeIds: ['e1'] });

      // Exclude e1. min(0, 3, 2)=0. zOrder=-1
      expect(getEdgeUpdates()[0].zOrder).toBe(-1);
    });
  });

  describe('sendToBack — z-index calculation', () => {
    it('should apply zOrder to ALL target nodes (not just root targets)', () => {
      const nodes = [
        { id: 'group1', selected: true, isGroup: true },
        { id: 'child1', selected: true, groupId: 'group1' },
        { id: 'other', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      sendToBack(commandHandler, { name: 'sendToBack' });

      const updates = getNodeUpdates();
      // Both group1 and child1 should get zOrder (not just group1)
      expect(updates.find((n) => n.id === 'group1')).toBeDefined();
      expect(updates.find((n) => n.id === 'child1')).toBeDefined();
    });

    it('should apply zOrder to parent hierarchy on sendToBack', () => {
      const nodes = [
        { id: 'group1', selected: false, isGroup: true },
        { id: 'child1', selected: false, groupId: 'group1' },
        { id: 'other', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      sendToBack(commandHandler, { name: 'sendToBack', nodeIds: ['child1'] });

      const updates = getNodeUpdates();
      const childZ = updates.find((n) => n.id === 'child1')!.zOrder;
      const parentZ = updates.find((n) => n.id === 'group1')!.zOrder;
      expect(parentZ).toBeLessThan(childZ);
    });

    it('should apply progressively lower zOrder to deep ancestor chain', () => {
      // Reverse order in array to ensure walk-up logic, not array order
      const nodes = [
        { id: 'leaf', selected: false, groupId: 'mid' },
        { id: 'mid', selected: false, isGroup: true, groupId: 'root' },
        { id: 'root', selected: false, isGroup: true },
        { id: 'other', selected: false, zOrder: 5 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      sendToBack(commandHandler, { name: 'sendToBack', nodeIds: ['leaf'] });

      const updates = getNodeUpdates();
      const leafZ = updates.find((n) => n.id === 'leaf')!.zOrder;
      const midZ = updates.find((n) => n.id === 'mid')!.zOrder;
      const rootZ = updates.find((n) => n.id === 'root')!.zOrder;
      expect(midZ).toBeLessThan(leafZ);
      expect(rootZ).toBeLessThan(midZ);
    });

    it('should use lowest zOrder when multiple targets share an ancestor', () => {
      const nodes = [
        { id: 'group1', selected: false, isGroup: true },
        { id: 'child1', selected: false, groupId: 'group1' },
        { id: 'child2', selected: false, groupId: 'group1' },
        { id: 'other', selected: false, zOrder: 5 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      sendToBack(commandHandler, { name: 'sendToBack', nodeIds: ['child1', 'child2'] });

      const updates = getNodeUpdates();
      const child1Z = updates.find((n) => n.id === 'child1')!.zOrder;
      const child2Z = updates.find((n) => n.id === 'child2')!.zOrder;
      const parentZ = updates.find((n) => n.id === 'group1')!.zOrder;
      // Both children get the same zOrder, parent gets lower
      expect(child1Z).toBe(child2Z);
      expect(parentZ).toBeLessThan(child1Z);
    });
  });

  describe('edge cases', () => {
    it('should produce zOrder 1 for bringToFront on single node', () => {
      mockGetState.mockReturnValue({ nodes: [{ id: '1', selected: false }], edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['1'] });

      expect(getNodeUpdates()[0].zOrder).toBe(1);
    });

    it('should produce zOrder -1 for sendToBack on single node', () => {
      mockGetState.mockReturnValue({ nodes: [{ id: '1', selected: false }], edges: [] });

      sendToBack(commandHandler, { name: 'sendToBack', nodeIds: ['1'] });

      expect(getNodeUpdates()[0].zOrder).toBe(-1);
    });

    it('should handle grandchild in target set with grandparent also targeted', () => {
      // Reverse order — leaf before root — to test hierarchy resolution
      const nodes = [
        { id: 'leaf', selected: true, groupId: 'mid' },
        { id: 'mid', selected: false, isGroup: true, groupId: 'root' },
        { id: 'root', selected: true, isGroup: true },
        { id: 'other', selected: false },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront' });

      // Only root is root target (leaf is descendant of root, even though mid is not selected)
      // All three get incrementing zOrder from root's subtree traversal
      const updates = getNodeUpdates();
      const rootZ = updates.find((n) => n.id === 'root')!.zOrder;
      const midZ = updates.find((n) => n.id === 'mid')!.zOrder;
      const leafZ = updates.find((n) => n.id === 'leaf')!.zOrder;
      // root gets base zOrder, mid and leaf get incrementing values (not their own independent zOrder)
      expect(midZ).toBe(rootZ + 1);
      expect(leafZ).toBe(rootZ + 2);
    });

    it('should handle orphaned node (missing parent)', () => {
      const nodes = [
        { id: 'orphan', selected: false, groupId: 'missing' },
        { id: 'other', selected: false, zOrder: 3 },
      ];
      mockGetState.mockReturnValue({ nodes, edges: [] });

      bringToFront(commandHandler, { name: 'bringToFront', nodeIds: ['orphan'] });

      expect(getNodeUpdates().find((n) => n.id === 'orphan')).toBeDefined();
    });
  });
});
