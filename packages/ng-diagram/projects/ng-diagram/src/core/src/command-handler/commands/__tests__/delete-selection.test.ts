import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';

describe('Delete Selection Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    const mockModelLookup = {
      getAllDescendantIds: vi.fn().mockReturnValue([]),
    };

    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      modelLookup: mockModelLookup,
      transactionManager: {
        isActive: vi.fn().mockReturnValue(false),
        getCurrentTransaction: vi.fn(),
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should delete selected nodes and edges', () => {
    const nodes = [
      { id: '1', selected: true },
      { id: '2', selected: false },
    ];
    const edges = [
      { id: '1', selected: false },
      { id: '2', selected: true },
    ];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });

    commandHandler.emit('deleteSelection');

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToRemove: ['1'], edgesToRemove: ['2'] },
      'deleteSelection'
    );
  });

  it('should not delete anything if no nodes or edges are selected', () => {
    const nodes = [
      { id: '1', selected: false },
      { id: '2', selected: false },
    ];
    const edges = [
      { id: '1', selected: false },
      { id: '2', selected: false },
    ];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });

    commandHandler.emit('deleteSelection');

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should delete selected nodes and edges which were connected to the selected nodes', () => {
    const nodes = [
      { id: '1', selected: false },
      { id: '2', selected: true },
    ];
    const edges = [
      { id: '1', selected: false, source: '1', target: '2' },
      { id: '2', selected: false, source: '1', target: '2' },
      { id: '2', selected: false, source: '3', target: '4' },
    ];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });

    commandHandler.emit('deleteSelection');

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToRemove: ['2'], edgesToRemove: ['1', '2'] },
      'deleteSelection'
    );
  });

  it('should delete all nodes in a 3-level nested group when grandparent is selected', () => {
    const nodes = [
      { id: 'grandparent', selected: true },
      { id: 'parent', selected: false, groupId: 'grandparent' },
      { id: 'child', selected: false, groupId: 'parent' },
      { id: 'standalone', selected: false },
    ];
    const edges = [
      { id: 'edge1', selected: false, source: 'grandparent', target: 'standalone' },
      { id: 'edge2', selected: false, source: 'parent', target: 'standalone' },
      { id: 'edge3', selected: false, source: 'child', target: 'standalone' },
      { id: 'edge4', selected: false, source: 'standalone', target: 'standalone' },
    ];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });
    (flowCore.modelLookup.getAllDescendantIds as ReturnType<typeof vi.fn>).mockImplementation((id: string) =>
      id === 'grandparent' ? ['parent', 'child'] : []
    );

    commandHandler.emit('deleteSelection');

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodesToRemove: ['grandparent', 'parent', 'child'],
        edgesToRemove: ['edge1', 'edge2', 'edge3'],
      },
      'deleteSelection'
    );
  });

  describe('hidden elements', () => {
    it('should not delete effectively hidden selected nodes', () => {
      const nodes = [
        { id: 'visible', selected: true },
        { id: 'hidden', selected: true, computedHidden: true },
      ];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges: [], metadata: {} });

      commandHandler.emit('deleteSelection');

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        { nodesToRemove: ['visible'], edgesToRemove: [] },
        'deleteSelection'
      );
    });

    it('should not delete effectively hidden selected edges', () => {
      const edges = [
        { id: 'visibleEdge', selected: true, source: 'a', target: 'b' },
        { id: 'hiddenEdge', selected: true, computedHidden: true, source: 'a', target: 'b' },
      ];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes: [], edges, metadata: {} });

      commandHandler.emit('deleteSelection');

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        { nodesToRemove: [], edgesToRemove: ['visibleEdge'] },
        'deleteSelection'
      );
    });

    it('should not delete anything when only hidden elements are selected', () => {
      const nodes = [{ id: 'hidden', selected: true, computedHidden: true }];
      const edges = [{ id: 'hiddenEdge', selected: true, computedHidden: true, source: 'a', target: 'b' }];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });

      commandHandler.emit('deleteSelection');

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should delete hidden descendants of a deleted visible group', () => {
      // A collapsed group: the group is visible and selected, its children hidden.
      const nodes = [
        { id: 'group', selected: true },
        { id: 'child', selected: false, computedHidden: true, groupId: 'group' },
      ];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges: [], metadata: {} });
      (flowCore.modelLookup.getAllDescendantIds as ReturnType<typeof vi.fn>).mockImplementation((id: string) =>
        id === 'group' ? ['child'] : []
      );

      commandHandler.emit('deleteSelection');

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        { nodesToRemove: ['group', 'child'], edgesToRemove: [] },
        'deleteSelection'
      );
    });

    it('should delete hidden edges connected to deleted nodes so they do not dangle', () => {
      const nodes = [{ id: 'node1', selected: true }];
      const edges = [{ id: 'hiddenEdge', selected: false, computedHidden: true, source: 'node1', target: 'other' }];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });

      commandHandler.emit('deleteSelection');

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        { nodesToRemove: ['node1'], edgesToRemove: ['hiddenEdge'] },
        'deleteSelection'
      );
    });
  });
});
