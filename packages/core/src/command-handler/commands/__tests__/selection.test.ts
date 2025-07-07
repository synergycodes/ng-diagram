import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockMetadata, mockNode } from '../../../test-utils';
import { CommandHandler } from '../../command-handler';
import { deselect, deselectAll, select } from '../selection';

describe('Selection Commands', () => {
  let commandHandler: CommandHandler;

  beforeEach(() => {
    commandHandler = {
      flowCore: {
        getState: vi.fn(),
        applyUpdate: vi.fn(),
      } as unknown as FlowCore,
    } as unknown as CommandHandler;
  });

  describe('select', () => {
    it('should select single node', () => {
      const nodes = [mockNode, { ...mockNode, id: 'node2' }];
      const edges = [mockEdge];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      select(commandHandler, { name: 'select', nodeIds: ['node1'] });

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: mockNode.id, selected: true }],
          edgesToUpdate: [],
        },
        'changeSelection'
      );
    });

    it('should select single edge', () => {
      const nodes = [mockNode];
      const edges = [mockEdge, { ...mockEdge, id: 'edge2' }];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      select(commandHandler, { name: 'select', edgeIds: ['edge1'] });

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [],
          edgesToUpdate: [{ id: mockEdge.id, selected: true }],
        },
        'changeSelection'
      );
    });

    it('should preserve existing selection when preserveSelection is true', () => {
      const nodes = [
        { ...mockNode, selected: true },
        { ...mockNode, id: 'node2', selected: true },
        { ...mockNode, id: 'node3' },
      ];
      const edges = [
        { ...mockEdge, selected: true },
        { ...mockEdge, id: 'edge2' },
      ];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      select(commandHandler, {
        name: 'select',
        nodeIds: ['node3'],
        preserveSelection: true,
      });

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: 'node3', selected: true }],
          edgesToUpdate: [],
        },
        'changeSelection'
      );
    });

    it('should not update state if selection has not changed', () => {
      const nodes = [{ ...mockNode, selected: true }];
      const edges = [{ ...mockEdge, selected: true }];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      select(commandHandler, {
        name: 'select',
        nodeIds: ['node1'],
        edgeIds: ['edge1'],
      });

      expect(commandHandler.flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deselect', () => {
    it('should deselect single node', () => {
      const nodes = [
        { ...mockNode, selected: true },
        { ...mockNode, id: 'node2', selected: true },
      ];
      const edges = [mockEdge];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      deselect(commandHandler, { name: 'deselect', nodeIds: ['node1'] });

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: mockNode.id, selected: false }],
          edgesToUpdate: [],
        },
        'changeSelection'
      );
    });

    it('should deselect single edge', () => {
      const nodes = [mockNode];
      const edges = [
        { ...mockEdge, selected: true },
        { ...mockEdge, id: 'edge2', selected: true },
      ];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      deselect(commandHandler, { name: 'deselect', edgeIds: ['edge1'] });

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [],
          edgesToUpdate: [{ id: 'edge1', selected: false }],
        },
        'changeSelection'
      );
    });

    it('should not update state if no elements are selected', () => {
      const nodes = [mockNode];
      const edges = [mockEdge];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      deselect(commandHandler, { name: 'deselect', nodeIds: ['node1'] });

      expect(commandHandler.flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('deselectAll', () => {
    it('should deselect all nodes and edges', () => {
      const nodes = [
        { ...mockNode, selected: true },
        { ...mockNode, id: 'node2', selected: true },
      ];
      const edges = [
        { ...mockEdge, selected: true },
        { ...mockEdge, id: 'edge2', selected: true },
      ];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      deselectAll(commandHandler);

      expect(commandHandler.flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: mockNode.id, selected: false },
            { id: 'node2', selected: false },
          ],
          edgesToUpdate: [
            { id: mockEdge.id, selected: false },
            { id: 'edge2', selected: false },
          ],
        },
        'changeSelection'
      );
    });

    it('should not update state if no elements are selected', () => {
      const nodes = [mockNode];
      const edges = [mockEdge];

      vi.spyOn(commandHandler.flowCore, 'getState').mockReturnValue({
        nodes,
        edges,
        metadata: mockMetadata,
      });

      deselectAll(commandHandler);

      expect(commandHandler.flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });
});
