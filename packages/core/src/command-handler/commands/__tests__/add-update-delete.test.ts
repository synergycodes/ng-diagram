import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandHandler } from '../../command-handler';
import { FlowCore } from '../../flow-core';

describe('Add Update Delete Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CoreCommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CoreCommandHandler(flowCore);
  });

  it('should add nodes to the flow', () => {
    const node1 = { id: '1', selected: true };
    const node2 = { id: '2', position: { x: 0, y: 0 }, data: {}, type: 'default' };

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes: [node1], edges: [], metadata: {} });

    commandHandler.emit('addNodes', { nodes: [node2] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodes: [node1, node2] }, 'addNodes');
  });

  it('should update a node', () => {
    const nodes = [{ id: '1', selected: false }];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges: [], metadata: {} });

    commandHandler.emit('updateNode', { id: '1', node: { selected: true } });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodes: [{ ...nodes[0], selected: true }] }, 'updateNode');
  });

  it('should delete nodes from the flow with edges connected to them', () => {
    const nodes = [{ id: '1', selected: true }];
    const edges = [{ id: '1', selected: false, source: '1', target: '2' }];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes, edges, metadata: {} });

    commandHandler.emit('deleteNodes', { ids: ['1'] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodes: [], edges: [] }, 'deleteNodes');
  });

  it('should add edges to the flow', () => {
    const edge1 = { id: '1', selected: true };
    const edge2 = { id: '2', source: '1', target: '2', data: {} };

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes: [], edges: [edge1], metadata: {} });

    commandHandler.emit('addEdges', { edges: [edge2] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edges: [edge1, edge2] }, 'addEdges');
  });

  it('should update an edge', () => {
    const edges = [{ id: '1', selected: false }];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes: [], edges, metadata: {} });

    commandHandler.emit('updateEdge', { id: '1', edge: { selected: true } });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edges: [{ ...edges[0], selected: true }] }, 'updateEdge');
  });

  it('should delete edges from the flow', () => {
    const edges = [{ id: '1', selected: true }];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes: [], edges, metadata: {} });

    commandHandler.emit('deleteEdges', { ids: ['1'] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edges: [] }, 'deleteEdges');
  });
});
