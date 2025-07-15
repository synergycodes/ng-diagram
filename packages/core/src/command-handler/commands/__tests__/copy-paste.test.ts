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
      it('should preserve port IDs but update nodeId references when pasting nodes', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            {
              ...mockNode,
              id: 'node1',
              selected: true,
              ports: [
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

        expect(pastedNode.ports).toHaveLength(2);
        // Port IDs should be preserved (not regenerated)
        expect(pastedNode.ports[0].id).toBe('port1');
        expect(pastedNode.ports[1].id).toBe('port2');
        // But nodeId should be updated to the new node ID
        expect(pastedNode.ports[0].nodeId).toBe(pastedNode.id);
        expect(pastedNode.ports[1].nodeId).toBe(pastedNode.id);
      });

      it('should preserve port IDs in edge references when pasting', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [
            {
              ...mockNode,
              id: 'node1',
              selected: true,
              ports: [{ id: 'port1', type: 'source', nodeId: 'node1', side: 'right' }],
            },
            {
              ...mockNode,
              id: 'node2',
              selected: true,
              ports: [{ id: 'port2', type: 'target', nodeId: 'node2', side: 'left' }],
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
              labels: [
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

        expect(pastedEdge.labels).toHaveLength(2);
        expect(pastedEdge.labels[0].id).toBe('label1');
        expect(pastedEdge.labels[1].id).toBe('label2');
        expect(pastedEdge.labels[0].positionOnEdge).toBe(0.5);
        expect(pastedEdge.labels[1].positionOnEdge).toBe(0.8);
      });

      it('should handle nodes without ports', async () => {
        commandHandler.flowCore.getState = () => ({
          nodes: [{ ...mockNode, id: 'node1', selected: true, ports: undefined }],
          edges: [],
          metadata: mockMetadata,
        });

        await copy(commandHandler);
        await paste(commandHandler, { name: 'paste' });

        const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
        const [update] = updateCall.mock.calls[0];

        expect(update.nodesToAdd).toHaveLength(1);
        const pastedNode = update.nodesToAdd[0];
        expect(pastedNode.ports).toBeUndefined();
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
              labels: undefined,
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
        expect(pastedEdge.labels).toBeUndefined();
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
  });
});
