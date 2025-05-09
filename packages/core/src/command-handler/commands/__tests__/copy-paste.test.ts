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
    commandHandler = {
      flowCore: {
        getState: () => ({
          nodes: [
            { ...mockNode, id: 'node1', selected: true },
            { ...mockNode, id: 'node2', selected: false },
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
    it('should copy selected nodes and edges', () => {
      copy(commandHandler);
      paste(commandHandler);

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      // Verify new nodes were created with offset
      expect(update.nodes).toHaveLength(3); // 2 original + 1 copied
      const copiedNodes = update.nodes.filter((n: Node) => n.id !== 'node1' && n.id !== 'node2');
      expect(copiedNodes).toHaveLength(1);
      copiedNodes.forEach((node: Node) => {
        expect(node.position.x).toBe(mockNode.position.x + OFFSET);
        expect(node.position.y).toBe(mockNode.position.y + OFFSET);
        expect(node.selected).toBe(true);
      });

      // Verify new edges were created with correct source/target mapping
      expect(update.edges).toHaveLength(3); // 2 original + 1 copied
      const copiedEdges = update.edges.filter((e: Edge) => e.id !== 'edge1' && e.id !== 'edge2');
      expect(copiedEdges).toHaveLength(1);
    });

    it('should not copy anything if nothing is selected', () => {
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

      copy(commandHandler);
      paste(commandHandler);

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      expect(updateCall).not.toHaveBeenCalled();
    });
  });

  describe('paste', () => {
    it('should deselect original nodes and edges when pasting', () => {
      copy(commandHandler);
      paste(commandHandler);

      const updateCall = commandHandler.flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
      const [update] = updateCall.mock.calls[0];

      const originalNodes = update.nodes.filter((n: Node) => n.id === 'node1' || n.id === 'node2');
      const originalEdges = update.edges.filter((e: Edge) => e.id === 'edge1' || e.id === 'edge2');

      originalNodes.forEach((node: Node) => expect(node.selected).toBe(false));
      originalEdges.forEach((edge: Edge) => expect(edge.selected).toBe(false));
    });
  });
});
