import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';

describe('Delete Selection Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    const mockModelLookup = {
      getSelectedNodesWithChildren: vi.fn().mockReturnValue([]),
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
    (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([nodes[0]]);

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
    (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

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
    (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([nodes[1]]);

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

    (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([
      nodes[0], // grandparent
      nodes[1], // parent
      nodes[2], // child
    ]);

    commandHandler.emit('deleteSelection');

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodesToRemove: ['grandparent', 'parent', 'child'],
        edgesToRemove: ['edge1', 'edge2', 'edge3'],
      },
      'deleteSelection'
    );
  });
});
