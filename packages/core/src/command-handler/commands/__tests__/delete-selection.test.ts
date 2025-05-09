import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandHandler } from '../../command-handler';
import { FlowCore } from '../../flow-core';

describe('Delete Selection Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CoreCommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CoreCommandHandler(flowCore);
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

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodes: [nodes[1]], edges: [edges[0]] }, 'deleteSelection');
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

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodes: [nodes[0]], edges: [edges[2]] }, 'deleteSelection');
  });
});
