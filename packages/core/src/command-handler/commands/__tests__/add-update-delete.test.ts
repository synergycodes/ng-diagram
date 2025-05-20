import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockNode, mockPort } from '../../../test-utils';
import { CommandHandler } from '../../command-handler';

describe('Add Update Delete Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
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

    commandHandler.emit('updateNode', { id: '1', nodeChanges: { selected: true } });

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

    commandHandler.emit('updateEdge', { id: '1', edgeChanges: { selected: true } });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edges: [{ ...edges[0], selected: true }] }, 'updateEdge');
  });

  it('should delete edges from the flow', () => {
    const edges = [{ id: '1', selected: true }];

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes: [], edges, metadata: {} });

    commandHandler.emit('deleteEdges', { ids: ['1'] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edges: [] }, 'deleteEdges');
  });

  it('should add ports to a node', () => {
    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ nodes: [mockNode], edges: [], metadata: {} });

    commandHandler.emit('addPorts', { nodeId: mockNode.id, ports: [mockPort] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodes: [{ ...mockNode, ports: [mockPort] }] }, 'updateNode');
  });

  it('should update a port', () => {
    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [{ ...mockNode, ports: [mockPort] }],
      edges: [],
      metadata: {},
    });

    commandHandler.emit('updatePort', {
      nodeId: mockNode.id,
      portId: mockPort.id,
      portChanges: { size: { width: 100, height: 100 } },
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodes: [{ ...mockNode, ports: [{ ...mockPort, size: { width: 100, height: 100 } }] }] },
      'updateNode'
    );
  });

  it('should delete ports from a node', () => {
    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [{ ...mockNode, ports: [mockPort] }],
      edges: [],
      metadata: {},
    });

    commandHandler.emit('deletePorts', { nodeId: mockNode.id, portIds: [mockPort.id] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodes: [{ ...mockNode, ports: [] }] }, 'updateNode');
  });
});
