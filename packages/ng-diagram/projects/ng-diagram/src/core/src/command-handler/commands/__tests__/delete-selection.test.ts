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
});
