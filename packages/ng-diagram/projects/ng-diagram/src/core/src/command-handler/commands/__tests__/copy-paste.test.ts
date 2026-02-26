import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockMetadata, mockNode } from '../../../test-utils';
import type { Node } from '../../../types';
import { CommandHandler } from '../../command-handler';
import { copy, paste } from '../copy-paste';

describe('Copy-Paste Commands', () => {
  let commandHandler: CommandHandler;
  const OFFSET = 20;

  beforeEach(() => {
    // Mock ID generation functions
    const mockComputeNodeId = vi.fn().mockImplementation(() => `generated-node-${Math.random()}`);
    const mockComputeEdgeId = vi.fn().mockImplementation(() => `generated-edge-${Math.random()}`);

    const mockActionStateManager = {
      copyPaste: undefined,
    };

    commandHandler = {
      flowCore: {
        getState: () => ({
          nodes: [
            { ...mockNode, id: 'node1', position: { x: 10, y: 20 }, selected: true },
            { ...mockNode, id: 'node2', position: { x: 30, y: 40 }, selected: false },
          ],
          edges: [
            { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', selected: true },
            { ...mockEdge, id: 'edge2', source: 'node2', target: 'node1', selected: false },
          ],
          metadata: mockMetadata,
        }),
        applyUpdate: vi.fn(),
        config: {
          computeNodeId: mockComputeNodeId,
          computeEdgeId: mockComputeEdgeId,
        },
        actionStateManager: mockActionStateManager,
      } as unknown as FlowCore,
    } as unknown as CommandHandler;
  });

  describe('copy', () => {
    it('should copy selected nodes and edges', async () => {
      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste' });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      expect(update.nodesToAdd).toHaveLength(1);
      expect(update.edgesToAdd).toHaveLength(1);
      expect(update.nodesToAdd[0].selected).toBe(true);
      expect(update.edgesToAdd[0].selected).toBe(true);
    });

    it('should not copy anything if nothing is selected', async () => {
      commandHandler.flowCore.getState = () => ({
        nodes: [
          { ...mockNode, id: 'node1', selected: false },
          { ...mockNode, id: 'node2', selected: false },
        ],
        edges: [
          { ...mockEdge, id: 'edge1', selected: false },
          { ...mockEdge, id: 'edge2', selected: false },
        ],
        metadata: mockMetadata,
      });

      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste' });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      expect(updateCall).not.toHaveBeenCalled();
    });
  });

  describe('paste', () => {
    describe('default behavior (no position specified)', () => {
      it('should paste with default offset', async () => {
        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        const pastedNode = update.nodesToAdd[0];
        expect(pastedNode.position.x).toBe(10 + OFFSET); // original position + offset
        expect(pastedNode.position.y).toBe(20 + OFFSET);
      });
    });

    describe('position-based pasting', () => {
      it('should center single node at cursor position', async () => {
        // Set up single node with size
        commandHandler.flowCore.getState = () => ({
          nodes: [
            {
              ...mockNode,
              id: 'node1',
              position: { x: 10, y: 20 },
              size: { width: 100, height: 50 },
              selected: true,
            },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste', position: { x: 200, y: 300 } });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        const pastedNode = update.nodesToAdd[0];
        // Position should be adjusted so cursor is at node center
        // For node with size 100x50, cursor at (200, 300) means top-left should be at (150, 275)
        expect(pastedNode.position.x).toBe(150); // cursor.x - width/2 = 200 - 50
        expect(pastedNode.position.y).toBe(275); // cursor.y - height/2 = 300 - 25
      });

      it('should handle single node without size', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            {
              ...mockNode,
              id: 'node1',
              position: { x: 10, y: 20 },
              selected: true,
            },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste', position: { x: 200, y: 300 } });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        const pastedNode = update.nodesToAdd[0];
        // Without size, cursor should be at the node position (no offset needed)
        expect(pastedNode.position.x).toBe(200); // cursor.x (no size offset)
        expect(pastedNode.position.y).toBe(300); // cursor.y (no size offset)
      });

      it('should maintain relative positioning for multiple nodes', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, selected: true },
            { ...mockNode, id: 'node2', position: { x: 50, y: 50 }, selected: true },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste', position: { x: 100, y: 100 } });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(2);

        // Center of original nodes is at (25, 25)
        // Cursor position is (100, 100)
        // Offset should be (75, 75)
        const nodes = update.nodesToAdd.sort((a: Node, b: Node) => a.position.x - b.position.x);

        expect(nodes[0].position.x).toBe(75); // 0 + 75
        expect(nodes[0].position.y).toBe(75); // 0 + 75
        expect(nodes[1].position.x).toBe(125); // 50 + 75
        expect(nodes[1].position.y).toBe(125); // 50 + 75
      });
    });

    describe('ID regeneration', () => {
      it('should generate new IDs for nodes and preserve port IDs but update nodeId references', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            {
              ...mockNode,
              id: 'node1',
              selected: true,
              measuredPorts: [
                { id: 'port1', type: 'source', nodeId: 'node1', side: 'top' },
                { id: 'port2', type: 'target', nodeId: 'node1', side: 'bottom' },
              ],
            },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        const pastedNode = update.nodesToAdd[0];

        // Node should have a new generated ID
        expect(pastedNode.id).not.toBe('node1');
        expect(pastedNode.id).toMatch(/^generated-node-/);

        expect(pastedNode.measuredPorts).toHaveLength(2);
        // Port IDs should be preserved (not regenerated)
        expect(pastedNode.measuredPorts[0].id).toBe('port1');
        expect(pastedNode.measuredPorts[1].id).toBe('port2');
        // But nodeId should be updated to the new node ID
        expect(pastedNode.measuredPorts[0].nodeId).toBe(pastedNode.id);
        expect(pastedNode.measuredPorts[1].nodeId).toBe(pastedNode.id);
      });

      it('should preserve port IDs in edge references when pasting', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            {
              ...mockNode,
              id: 'node1',
              selected: true,
              measuredPorts: [{ id: 'port1', type: 'source', nodeId: 'node1', side: 'right' }],
            },
            {
              ...mockNode,
              id: 'node2',
              selected: true,
              measuredPorts: [{ id: 'port2', type: 'target', nodeId: 'node2', side: 'left' }],
            },
          ],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              sourcePort: 'port1',
              targetPort: 'port2',
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(2);
        expect(update.edgesToAdd).toHaveLength(1);

        const pastedEdge = update.edgesToAdd[0];
        const pastedNodes = update.nodesToAdd;

        // Edge should have a new generated ID
        expect(pastedEdge.id).not.toBe('edge1');
        expect(pastedEdge.id).toMatch(/^generated-edge-/);

        // Edge should reference new node IDs
        expect(pastedNodes.some((node: Node) => node.id === pastedEdge.source)).toBe(true);
        expect(pastedNodes.some((node: Node) => node.id === pastedEdge.target)).toBe(true);

        // Edge should preserve original port IDs
        expect(pastedEdge.sourcePort).toBe('port1');
        expect(pastedEdge.targetPort).toBe('port2');
      });

      it('should preserve edge label IDs when pasting edges', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: true },
            { ...mockNode, id: 'node2', selected: true },
          ],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              selected: true,
              measuredLabels: [
                { id: 'label1', positionOnEdge: 0.5 },
                { id: 'label2', positionOnEdge: 0.8 },
              ],
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.edgesToAdd).toHaveLength(1);
        const pastedEdge = update.edgesToAdd[0];

        expect(pastedEdge.measuredLabels).toHaveLength(2);
        expect(pastedEdge.measuredLabels[0].id).toBe('label1');
        expect(pastedEdge.measuredLabels[1].id).toBe('label2');
        expect(pastedEdge.measuredLabels[0].positionOnEdge).toBe(0.5);
        expect(pastedEdge.measuredLabels[1].positionOnEdge).toBe(0.8);
      });

      it('should handle nodes without ports', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [{ ...mockNode, id: 'node1', selected: true, measuredPorts: undefined }],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        const pastedNode = update.nodesToAdd[0];
        expect(pastedNode.measuredPorts).toBeUndefined();
      });

      it('should handle edges without labels', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: true },
            { ...mockNode, id: 'node2', selected: true },
          ],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              selected: true,
              measuredLabels: undefined,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.edgesToAdd).toHaveLength(1);
        const pastedEdge = update.edgesToAdd[0];
        expect(pastedEdge.measuredLabels).toBeUndefined();
      });
    });

    describe('deselection behavior', () => {
      it('should deselect original nodes and edges when pasting', async () => {
        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToUpdate).toEqual([{ id: 'node1', selected: false }]);
        expect(update.edgesToUpdate).toEqual([{ id: 'edge1', selected: false }]);
      });

      it('should not create deselect updates for unselected items', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: true },
            { ...mockNode, id: 'node2', selected: false },
          ],
          edges: [
            { ...mockEdge, id: 'edge1', selected: false },
            { ...mockEdge, id: 'edge2', selected: false },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToUpdate).toEqual([{ id: 'node1', selected: false }]);
        expect(update.edgesToUpdate).toEqual([]);
      });
    });

    describe('selection events', () => {
      it('should set selectionChanged action state', async () => {
        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        expect(commandHandler.flowCore.actionStateManager.selection).toEqual({ selectionChanged: true });
      });

      it('should emit selectEnd after paste update', async () => {
        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        expect(updateCall).toHaveBeenCalledTimes(2);
        expect(updateCall.mock.calls[1]).toEqual([{}, 'selectEnd']);
      });
    });

    describe('edge handling', () => {
      it('should update edge references to new node IDs', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: true },
            { ...mockNode, id: 'node2', selected: true },
          ],
          edges: [{ ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', selected: true }],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(2);
        expect(update.edgesToAdd).toHaveLength(1);

        const edge = update.edgesToAdd[0];
        const nodes = update.nodesToAdd;

        // Edge should reference new node IDs
        expect(nodes.some((node: Node) => node.id === edge.source)).toBe(true);
        expect(nodes.some((node: Node) => node.id === edge.target)).toBe(true);
        expect(edge.source).not.toBe('node1');
        expect(edge.target).not.toBe('node2');
      });
    });

    describe('empty clipboard', () => {
      it('should do nothing when clipboard is empty', async () => {
        // Set up state with no selected items to ensure clipboard is empty
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: false },
            { ...mockNode, id: 'node2', selected: false },
          ],
          edges: [
            { ...mockEdge, id: 'edge1', selected: false },
            { ...mockEdge, id: 'edge2', selected: false },
          ],
          metadata: mockMetadata,
        });

        // Copy nothing (empty selection)
        await copy(commandHandler);

        // Try to paste
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        expect(updateCall).not.toHaveBeenCalled();
      });
    });

    describe('groupId handling', () => {
      it('should remove groupId when copying node without its group', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'group1', selected: false }, // Group not selected
            { ...mockNode, id: 'node1', groupId: 'group1', selected: true }, // Child node selected
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        const pastedNode = update.nodesToAdd[0];
        expect(pastedNode.groupId).toBeUndefined();
      });

      it('should update groupId to new group ID when copying node with its group', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'group1', selected: true }, // Group selected
            { ...mockNode, id: 'node1', groupId: 'group1', selected: true }, // Child node selected
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(2);

        // Find the pasted group and child node
        const pastedGroup = update.nodesToAdd.find((node: Node) => !node.groupId);
        const pastedChild = update.nodesToAdd.find((node: Node) => node.groupId);

        expect(pastedGroup).toBeDefined();
        expect(pastedChild).toBeDefined();
        // Child's groupId should reference the new group's ID
        expect(pastedChild!.groupId).toBe(pastedGroup!.id);
        // New IDs should be generated
        expect(pastedGroup!.id).not.toBe('group1');
        expect(pastedChild!.id).not.toBe('node1');
      });

      it('should update groupId for multiple children when copying with their group', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'group1', selected: true },
            { ...mockNode, id: 'node1', groupId: 'group1', selected: true },
            { ...mockNode, id: 'node2', groupId: 'group1', selected: true },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(3);

        const pastedGroup = update.nodesToAdd.find((node: Node) => !node.groupId);
        const pastedChildren = update.nodesToAdd.filter((node: Node) => node.groupId);

        expect(pastedGroup).toBeDefined();
        expect(pastedChildren).toHaveLength(2);
        // All children should reference the same new group ID
        pastedChildren.forEach((child: Node) => {
          expect(child.groupId).toBe(pastedGroup!.id);
        });
      });

      it('should handle nested groups correctly', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'outerGroup', selected: true },
            { ...mockNode, id: 'innerGroup', groupId: 'outerGroup', selected: true },
            { ...mockNode, id: 'node1', groupId: 'innerGroup', selected: true },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(3);

        // Find nodes by their groupId relationships
        const pastedOuterGroup = update.nodesToAdd.find((node: Node) => !node.groupId);
        const pastedInnerGroup = update.nodesToAdd.find(
          (node: Node) =>
            node.groupId === pastedOuterGroup?.id && update.nodesToAdd.some((n: Node) => n.groupId === node.id)
        );
        const pastedNode = update.nodesToAdd.find((node: Node) => node.groupId === pastedInnerGroup?.id);

        expect(pastedOuterGroup).toBeDefined();
        expect(pastedInnerGroup).toBeDefined();
        expect(pastedNode).toBeDefined();

        // Verify the hierarchy is preserved with new IDs
        expect(pastedInnerGroup!.groupId).toBe(pastedOuterGroup!.id);
        expect(pastedNode!.groupId).toBe(pastedInnerGroup!.id);
      });

      it('should remove groupId when copying only inner group without outer group', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'outerGroup', selected: false }, // Outer group NOT selected
            { ...mockNode, id: 'innerGroup', groupId: 'outerGroup', selected: true },
            { ...mockNode, id: 'node1', groupId: 'innerGroup', selected: true },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(2);

        // Find the pasted inner group (should have no groupId since outer wasn't copied)
        const pastedInnerGroup = update.nodesToAdd.find(
          (node: Node) => !node.groupId && update.nodesToAdd.some((n: Node) => n.groupId === node.id)
        );
        const pastedNode = update.nodesToAdd.find((node: Node) => node.groupId);

        expect(pastedInnerGroup).toBeDefined();
        expect(pastedInnerGroup!.groupId).toBeUndefined(); // Inner group should no longer reference outer
        expect(pastedNode).toBeDefined();
        expect(pastedNode!.groupId).toBe(pastedInnerGroup!.id); // Node should still reference inner group
      });
    });
  });
});
