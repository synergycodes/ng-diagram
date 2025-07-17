import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { paste } from '../copy-paste';
import { cut } from '../cut';

describe('Cut Command', () => {
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

  it('should remove selected nodes and edges when cut is invoked', async () => {
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

    await cut(commandHandler);

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToRemove: ['1'], edgesToRemove: ['2'] },
      'deleteSelection'
    );
  });

  it('should not remove anything if no nodes or edges are selected', async () => {
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

    await cut(commandHandler);

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should remove selected nodes and edges connected to selected nodes', async () => {
    const nodes = [
      { id: '1', selected: false },
      { id: '2', selected: true },
    ];
    const edges = [
      { id: '1', selected: false, source: '1', target: '2' },
      { id: '2', selected: false, source: '1', target: '2' },
      { id: '3', selected: false, source: '3', target: '4' },
    ];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });
    (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([nodes[1]]);

    await cut(commandHandler);

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToRemove: ['2'], edgesToRemove: ['1', '2'] },
      'deleteSelection'
    );
  });

  it('should copy to clipboard and allow pasting after cut', async () => {
    const nodes = [
      { id: '1', selected: true, position: { x: 10, y: 20 } },
      { id: '2', selected: false, position: { x: 30, y: 40 } },
    ];
    const edges = [
      { id: '1', selected: false, source: '1', target: '2' },
      { id: '2', selected: true, source: '2', target: '1' },
    ];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });
    (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([nodes[0]]);

    await cut(commandHandler);
    paste(commandHandler);

    const updateCall = flowCore.applyUpdate as unknown as ReturnType<typeof vi.fn>;
    const updateCallWithNodesToAdd = updateCall.mock.calls.find((call) => call[0].nodesToAdd);

    expect(updateCallWithNodesToAdd).toBeDefined();
    const [update] = updateCallWithNodesToAdd!;
    expect(update.nodesToAdd).toHaveLength(1);
    expect(update.nodesToAdd[0].id).not.toBe('1');
    expect(update.nodesToAdd[0].selected).toBe(true);
    expect(update.edgesToAdd).toBeDefined();
  });
});
