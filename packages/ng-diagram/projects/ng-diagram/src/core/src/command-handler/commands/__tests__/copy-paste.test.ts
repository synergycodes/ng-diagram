import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockMetadata, mockNode } from '../../../test-utils';
import type { Edge, Node } from '../../../types';
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
        modelLookup: {
          getAllDescendantIds: vi.fn().mockReturnValue([]),
        },
        config: {
          computeNodeId: mockComputeNodeId,
          computeEdgeId: mockComputeEdgeId,
          snapping: {
            shouldSnapDragForNode: () => false,
            computeSnapForNodeDrag: () => null,
            defaultDragSnap: { width: 10, height: 10 },
          },
        },
        actionStateManager: mockActionStateManager,
      } as unknown as FlowCore,
    } as unknown as CommandHandler;
  });

  describe('copy', () => {
    it('should copy selected nodes and edges', async () => {
      commandHandler.flowCore.getState = () => ({
        nodes: [
          { ...mockNode, id: 'node1', position: { x: 10, y: 20 }, selected: true },
          { ...mockNode, id: 'node2', position: { x: 30, y: 40 }, selected: true },
        ],
        edges: [
          { ...mockEdge, id: 'edge1', source: 'node1', target: 'node2', selected: true },
          { ...mockEdge, id: 'edge2', source: 'node2', target: 'outside', selected: false },
        ],
        metadata: mockMetadata,
      });

      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste' });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      expect(update.nodesToAdd).toHaveLength(2);
      expect(update.edgesToAdd).toHaveLength(1);
      expect(update.nodesToAdd[0].selected).toBe(true);
      expect(update.edgesToAdd[0].selected).toBe(true);
    });

    describe('dangling edges travelling with copied nodes', () => {
      const setDanglingEnabled = (enabled: boolean) => {
        (commandHandler.flowCore.config as unknown as { danglingEdges: { enabled: boolean } }).danglingEdges = {
          enabled,
        };
      };

      const copyPasteState = () =>
        (
          commandHandler.flowCore.actionStateManager as unknown as {
            copyPaste: { copiedNodes: Node[]; copiedEdges: Edge[] };
          }
        ).copyPaste;

      const singleDanglingEdge: Edge = {
        ...mockEdge,
        id: 'dangling-edge',
        source: 'node1',
        sourcePort: 'out',
        target: '',
        targetPort: undefined,
        targetPosition: { x: 300, y: 400 },
        selected: false,
      };

      const dualDanglingEdge: Edge = {
        ...mockEdge,
        id: 'dual-dangling-edge',
        source: '',
        sourcePort: undefined,
        sourcePosition: { x: 10, y: 20 },
        target: '',
        targetPort: undefined,
        targetPosition: { x: 300, y: 400 },
        selected: false,
      };

      const stateWith = (edges: Edge[]) => () => ({
        nodes: [
          { ...mockNode, id: 'node1', position: { x: 10, y: 20 }, selected: true },
          { ...mockNode, id: 'node2', position: { x: 30, y: 40 }, selected: false },
        ],
        edges,
        metadata: mockMetadata,
      });

      it('should copy an unselected single-dangling edge together with its copied node when enabled', async () => {
        setDanglingEnabled(true);
        commandHandler.flowCore.getState = stateWith([singleDanglingEdge]);

        await copy(commandHandler);

        expect(copyPasteState().copiedEdges.map((edge) => edge.id)).toEqual(['dangling-edge']);
      });

      it('should not copy an unselected single-dangling edge when the feature is disabled', async () => {
        setDanglingEnabled(false);
        commandHandler.flowCore.getState = stateWith([singleDanglingEdge]);

        await copy(commandHandler);

        expect(copyPasteState().copiedEdges).toEqual([]);
      });

      it('should not copy a dangling edge whose connected node was not copied', async () => {
        setDanglingEnabled(true);
        commandHandler.flowCore.getState = stateWith([{ ...singleDanglingEdge, source: 'node2' }]);

        await copy(commandHandler);

        expect(copyPasteState().copiedEdges).toEqual([]);
      });

      it('should copy a dual dangling edge only when it is selected', async () => {
        setDanglingEnabled(true);
        commandHandler.flowCore.getState = stateWith([dualDanglingEdge]);

        await copy(commandHandler);

        // Unselected: no connected endpoint inside the copied set — not copied.
        expect(copyPasteState().copiedEdges).toEqual([]);

        commandHandler.flowCore.getState = stateWith([{ ...dualDanglingEdge, selected: true }]);

        await copy(commandHandler);

        expect(copyPasteState().copiedEdges.map((edge) => edge.id)).toEqual(['dual-dangling-edge']);
      });
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

      it('should center a fully dangling pasted edge at the cursor', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: false },
            { ...mockNode, id: 'node2', selected: false },
          ],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              sourcePosition: { x: 0, y: 0 },
              targetPosition: { x: 100, y: 100 },
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste', position: { x: 500, y: 500 } });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.edgesToAdd).toHaveLength(1);
        const pastedEdge = update.edgesToAdd[0];
        // Endpoint center is (50, 50), cursor is (500, 500) → offset (450, 450).
        expect(pastedEdge.sourcePosition).toEqual({ x: 450, y: 450 });
        expect(pastedEdge.targetPosition).toEqual({ x: 550, y: 550 });
      });

      it('should center a collection of dangling pasted edges at the cursor, keeping relative layout', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: '',
              target: '',
              sourcePosition: { x: 0, y: 0 },
              targetPosition: { x: 100, y: 0 },
              selected: true,
            },
            {
              ...mockEdge,
              id: 'edge2',
              source: '',
              target: '',
              sourcePosition: { x: 0, y: 100 },
              targetPosition: { x: 100, y: 100 },
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste', position: { x: 300, y: 400 } });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.edgesToAdd).toHaveLength(2);
        // Endpoint center is (50, 50), cursor is (300, 400) → offset (250, 350).
        const [first, second] = update.edgesToAdd;
        expect(first.sourcePosition).toEqual({ x: 250, y: 350 });
        expect(first.targetPosition).toEqual({ x: 350, y: 350 });
        expect(second.sourcePosition).toEqual({ x: 250, y: 450 });
        expect(second.targetPosition).toEqual({ x: 350, y: 450 });
      });

      it('should include free edge endpoints in the paste-at-cursor center for mixed content', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, selected: true },
            { ...mockNode, id: 'node2', position: { x: 100, y: 0 }, selected: false },
          ],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              targetPosition: { x: 100, y: 0 },
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste', position: { x: 500, y: 500 } });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        expect(update.edgesToAdd).toHaveLength(1);
        // Center of node (0, 0) and freed endpoint (100, 0) is (50, 0) →
        // offset (450, 500): the whole pasted content centers at the cursor.
        expect(update.nodesToAdd[0].position).toEqual({ x: 450, y: 500 });
        expect(update.edgesToAdd[0].targetPosition).toEqual({ x: 550, y: 500 });
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

    describe('snapping', () => {
      it('should snap pasted node positions when snapping is enabled', async () => {
        commandHandler.flowCore.config.snapping.shouldSnapDragForNode = () => true;
        commandHandler.flowCore.config.snapping.computeSnapForNodeDrag = () => null;
        commandHandler.flowCore.config.snapping.defaultDragSnap = { width: 20, height: 20 };

        commandHandler.flowCore.getState = () => ({
          nodes: [{ ...mockNode, id: 'node1', position: { x: 10, y: 20 }, selected: true }],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        const pastedNode = update.nodesToAdd[0];
        // 10 + 20 offset = 30, snapped to 40; 20 + 20 offset = 40, already snapped
        expect(pastedNode.position.x).toBe(40);
        expect(pastedNode.position.y).toBe(40);
      });

      it('should use computeSnapForNodeDrag when provided for paste', async () => {
        commandHandler.flowCore.config.snapping.shouldSnapDragForNode = () => true;
        commandHandler.flowCore.config.snapping.computeSnapForNodeDrag = () => ({ width: 50, height: 50 });
        commandHandler.flowCore.config.snapping.defaultDragSnap = { width: 10, height: 10 };

        commandHandler.flowCore.getState = () => ({
          nodes: [{ ...mockNode, id: 'node1', position: { x: 10, y: 20 }, selected: true }],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        const pastedNode = update.nodesToAdd[0];
        // 10 + 20 offset = 30, snapped to 50; 20 + 20 offset = 40, snapped to 50
        expect(pastedNode.position.x).toBe(50);
        expect(pastedNode.position.y).toBe(50);
      });

      it('should not snap pasted node positions when snapping is disabled', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [{ ...mockNode, id: 'node1', position: { x: 13, y: 27 }, selected: true }],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        const pastedNode = update.nodesToAdd[0];
        expect(pastedNode.position.x).toBe(13 + OFFSET);
        expect(pastedNode.position.y).toBe(27 + OFFSET);
      });

      it('should snap position-based paste when snapping is enabled', async () => {
        commandHandler.flowCore.config.snapping.shouldSnapDragForNode = () => true;
        commandHandler.flowCore.config.snapping.computeSnapForNodeDrag = () => null;
        commandHandler.flowCore.config.snapping.defaultDragSnap = { width: 20, height: 20 };

        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', position: { x: 10, y: 20 }, size: { width: 100, height: 50 }, selected: true },
          ],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste', position: { x: 203, y: 307 } });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        const pastedNode = update.nodesToAdd[0];
        // cursor 203 - width/2 50 = 153, snapped to 160; cursor 307 - height/2 25 = 282, snapped to 280
        expect(pastedNode.position.x).toBe(160);
        expect(pastedNode.position.y).toBe(280);
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

      it('should paste an edge whose endpoints were not copied as fully dangling instead of attaching it to the original nodes', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: false },
            { ...mockNode, id: 'node2', selected: false },
          ],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              sourcePosition: { x: 10, y: 10 },
              targetPosition: { x: 110, y: 110 },
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        // Only the edge is selected — its endpoints stay behind.
        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(0);
        expect(update.edgesToAdd).toHaveLength(1);
        const pastedEdge = update.edgesToAdd[0];
        // Both endpoints freed, keeping the edge's shape at the paste offset.
        expect(pastedEdge.source).toBe('');
        expect(pastedEdge.target).toBe('');
        expect(pastedEdge.sourcePosition).toEqual({ x: 10 + OFFSET, y: 10 + OFFSET });
        expect(pastedEdge.targetPosition).toEqual({ x: 110 + OFFSET, y: 110 + OFFSET });
      });

      it('should free only the uncopied endpoint when one endpoint was copied', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: true },
            { ...mockNode, id: 'node2', selected: false },
          ],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              sourcePort: 'port1',
              targetPort: 'port2',
              targetPosition: { x: 200, y: 100 },
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        expect(update.edgesToAdd).toHaveLength(1);
        const pastedEdge = update.edgesToAdd[0];
        // The copied endpoint is remapped and keeps its port.
        expect(pastedEdge.source).toBe(update.nodesToAdd[0].id);
        expect(pastedEdge.sourcePort).toBe('port1');
        // The uncopied endpoint becomes dangling: no node, no port, an
        // authored position at the old attachment point plus the offset.
        expect(pastedEdge.target).toBe('');
        expect(pastedEdge.targetPort).toBeUndefined();
        expect(pastedEdge.targetPosition).toEqual({ x: 200 + OFFSET, y: 100 + OFFSET });
      });

      it('should author freed endpoint positions from the routed points when positions are missing', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              sourcePosition: undefined,
              targetPosition: undefined,
              points: [
                { x: 0, y: 0 },
                { x: 50, y: 0 },
                { x: 100, y: 100 },
              ],
              selected: true,
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
        expect(pastedEdge.sourcePosition).toEqual({ x: 0 + OFFSET, y: 0 + OFFSET });
        expect(pastedEdge.targetPosition).toEqual({ x: 100 + OFFSET, y: 100 + OFFSET });
      });

      it('should skip an edge whose freed endpoint has no position to dangle from', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              sourcePosition: undefined,
              targetPosition: undefined,
              points: undefined,
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        // Nothing pasteable: no update at all, current selection untouched.
        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        expect(updateCall).not.toHaveBeenCalled();
      });

      it('should paste dangling endpoints as dangling, shifted by the paste offset', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [{ ...mockNode, id: 'node1', position: { x: 10, y: 20 }, selected: true }],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: '',
              sourcePosition: { x: 100, y: 200 },
              target: 'node1',
              selected: true,
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
        // The free endpoint stays free and moves with the pasted content.
        expect(pastedEdge.source).toBe('');
        expect(pastedEdge.sourcePosition).toEqual({ x: 100 + OFFSET, y: 200 + OFFSET });
        // The connected endpoint is remapped to the pasted node.
        expect(pastedEdge.target).toBe(update.nodesToAdd[0].id);
      });

      it('should paste a fully dangling edge copied on its own', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [],
          edges: [
            {
              ...mockEdge,
              id: 'edge1',
              source: '',
              target: '',
              sourcePosition: { x: 0, y: 0 },
              targetPosition: { x: 50, y: 50 },
              selected: true,
            },
          ],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(0);
        expect(update.edgesToAdd).toHaveLength(1);
        const pastedEdge = update.edgesToAdd[0];
        expect(pastedEdge.sourcePosition).toEqual({ x: OFFSET, y: OFFSET });
        expect(pastedEdge.targetPosition).toEqual({ x: 50 + OFFSET, y: 50 + OFFSET });
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

  describe('dangling edges', () => {
    it('should offset the free endpoint position and the points of a pasted dangling edge', async () => {
      commandHandler.flowCore.getState = () => ({
        nodes: [{ ...mockNode, id: 'node1', position: { x: 10, y: 20 }, selected: true }],
        edges: [
          {
            ...mockEdge,
            id: 'edge1',
            source: 'node1',
            target: '',
            targetPosition: { x: 300, y: 300 },
            // Manual routing: the stored path is the truth, so paste must
            // shift it along with the free endpoint (auto edges re-route).
            routingMode: 'manual' as const,
            points: [
              { x: 110, y: 120 },
              { x: 300, y: 300 },
            ],
            selected: true,
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
      // The free end travels with the default (20, 20) paste offset, and the
      // stored path travels along so it stays aligned.
      expect(pastedEdge.target).toBe('');
      expect(pastedEdge.targetPosition).toEqual({ x: 320, y: 320 });
      expect(pastedEdge.points).toEqual([
        { x: 130, y: 140 },
        { x: 320, y: 320 },
      ]);
      // The connected end is remapped to the pasted node.
      expect(pastedEdge.source).toBe(update.nodesToAdd[0].id);
    });

    it('should anchor a paste of only a dangling edge at its free endpoint center', async () => {
      commandHandler.flowCore.getState = () => ({
        nodes: [],
        edges: [
          {
            ...mockEdge,
            id: 'edge1',
            source: '',
            target: '',
            sourcePosition: { x: 0, y: 0 },
            targetPosition: { x: 100, y: 100 },
            routingMode: 'manual' as const,
            points: [
              { x: 0, y: 0 },
              { x: 100, y: 100 },
            ],
            selected: true,
          },
        ],
        metadata: mockMetadata,
      });

      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste', position: { x: 200, y: 200 } });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      expect(update.nodesToAdd).toHaveLength(0);
      expect(update.edgesToAdd).toHaveLength(1);
      const pastedEdge = update.edgesToAdd[0];
      // Free endpoint center is (50, 50), cursor at (200, 200) → offset (150, 150).
      expect(pastedEdge.sourcePosition).toEqual({ x: 150, y: 150 });
      expect(pastedEdge.targetPosition).toEqual({ x: 250, y: 250 });
      expect(pastedEdge.points).toEqual([
        { x: 150, y: 150 },
        { x: 250, y: 250 },
      ]);
    });

    it('should offset the points of a manual-routing edge pasted with both of its nodes', async () => {
      const originalPoints = [
        { x: 10, y: 10 },
        { x: 30, y: 40 },
        { x: 60, y: 60 },
      ];
      commandHandler.flowCore.getState = () => ({
        nodes: [
          { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, selected: true },
          { ...mockNode, id: 'node2', position: { x: 50, y: 50 }, selected: true },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'edge1',
            source: 'node1',
            target: 'node2',
            routingMode: 'manual' as const,
            points: originalPoints,
            selected: true,
          },
        ],
        metadata: mockMetadata,
      });

      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste' });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      const pastedEdge = update.edgesToAdd[0];
      // Both ends move by the default (20, 20) paste offset, so the stored
      // path moves with them.
      expect(pastedEdge.points).toEqual([
        { x: 30, y: 30 },
        { x: 50, y: 60 },
        { x: 80, y: 80 },
      ]);
      expect(pastedEdge.source).toBe(update.nodesToAdd[0].id);
      expect(pastedEdge.target).toBe(update.nodesToAdd[1].id);
      expect(pastedEdge.sourcePosition).toBeUndefined();
      expect(pastedEdge.targetPosition).toBeUndefined();
    });

    it('should not offset the points of fully-connected pasted edges', async () => {
      const originalPoints = [
        { x: 5, y: 5 },
        { x: 45, y: 45 },
      ];
      commandHandler.flowCore.getState = () => ({
        nodes: [
          { ...mockNode, id: 'node1', position: { x: 0, y: 0 }, selected: true },
          { ...mockNode, id: 'node2', position: { x: 50, y: 50 }, selected: true },
        ],
        edges: [
          {
            ...mockEdge,
            id: 'edge1',
            source: 'node1',
            target: 'node2',
            points: originalPoints,
            selected: true,
          },
        ],
        metadata: mockMetadata,
      });

      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste' });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      // Fully-connected edges are re-routed from their new nodes instead.
      expect(update.edgesToAdd[0].points).toEqual(originalPoints);
      expect(update.edgesToAdd[0].sourcePosition).toBeUndefined();
      expect(update.edgesToAdd[0].targetPosition).toBeUndefined();
    });
  });

  describe('hidden elements', () => {
    const setState = (nodes: Partial<Node>[], edges: object[] = [], descendants: Record<string, string[]> = {}) => {
      const flowCore = commandHandler.flowCore as unknown as {
        getState: () => object;
        modelLookup: { getAllDescendantIds: ReturnType<typeof vi.fn> };
      };
      flowCore.getState = () => ({
        nodes: nodes.map((node) => ({ ...mockNode, ...node })),
        edges: edges.map((edge) => ({ ...mockEdge, ...edge })),
        metadata: mockMetadata,
      });
      flowCore.modelLookup.getAllDescendantIds.mockImplementation((id: string) => descendants[id] ?? []);
    };

    const copiedState = () =>
      (commandHandler.flowCore.actionStateManager as { copyPaste?: { copiedNodes: Node[]; copiedEdges: Edge[] } })
        .copyPaste;

    it('should not copy effectively hidden selected elements', async () => {
      setState(
        [
          { id: 'visible', selected: true },
          { id: 'hidden', selected: true, computedHidden: true },
        ],
        [
          { id: 'hiddenEdge', source: 'visible', target: 'other', selected: true, computedHidden: true },
          { id: 'visibleEdge', source: 'visible', target: 'other', selected: true },
        ]
      );

      await copy(commandHandler);

      expect(copiedState()!.copiedNodes.map((node) => node.id)).toEqual(['visible']);
      expect(copiedState()!.copiedEdges.map((edge) => edge.id)).toEqual(['visibleEdge']);
    });

    it('should copy hidden descendants of a copied group together with internal edges', async () => {
      // A collapsed group: group visible+selected, children hidden and unselected.
      setState(
        [
          { id: 'group', selected: true },
          { id: 'child1', groupId: 'group', hidden: true, computedHidden: true },
          { id: 'child2', groupId: 'group', hidden: true, computedHidden: true },
          { id: 'outside' },
        ],
        [
          { id: 'internal', source: 'child1', target: 'child2', computedHidden: true },
          { id: 'boundary', source: 'child1', target: 'outside', computedHidden: true },
        ],
        { group: ['child1', 'child2'] }
      );

      await copy(commandHandler);

      expect(copiedState()!.copiedNodes.map((node) => node.id)).toEqual(['group', 'child1', 'child2']);
      // The internal edge travels with the copied set; the boundary edge does not.
      expect(copiedState()!.copiedEdges.map((edge) => edge.id)).toEqual(['internal']);
    });

    it('should paste hidden content deselected so no invisible selection is created', async () => {
      setState(
        [
          { id: 'group', selected: true },
          { id: 'child', groupId: 'group', hidden: true, computedHidden: true },
        ],
        [{ id: 'internal', source: 'group', target: 'child', computedHidden: true }],
        { group: ['child'] }
      );

      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste' });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      const pastedGroup = update.nodesToAdd.find((node: Node) => !node.groupId);
      const pastedChild = update.nodesToAdd.find((node: Node) => node.groupId);
      expect(pastedGroup!.selected).toBe(true);
      expect(pastedChild!.selected).toBe(false);
      expect(pastedChild!.hidden).toBe(true);
      expect(update.edgesToAdd[0].selected).toBe(false);
    });

    it('should compute the paste-at-position offset from visible copied nodes only', async () => {
      setState(
        [
          { id: 'visible', selected: true, position: { x: 100, y: 100 }, size: { width: 50, height: 50 } },
          {
            id: 'farHidden',
            selected: true,
            groupId: 'visible',
            hidden: true,
            computedHidden: true,
            position: { x: 1100, y: 1100 },
          },
        ],
        [],
        { visible: ['farHidden'] }
      );

      await copy(commandHandler);
      await paste(commandHandler, { name: 'paste', position: { x: 500, y: 500 } });

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      // One visible copied node → it centers at the cursor; the hidden member
      // keeps its relative offset instead of dragging the center away.
      const pastedVisible = update.nodesToAdd.find((node: Node) => !node.hidden);
      expect(pastedVisible!.position).toEqual({ x: 500 - 25, y: 500 - 25 });
    });
  });
});
