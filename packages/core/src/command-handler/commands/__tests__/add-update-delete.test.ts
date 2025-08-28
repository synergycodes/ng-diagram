import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockEdgeLabel, mockNode, mockPort } from '../../../test-utils';
import { CommandHandler } from '../../command-handler';

describe('Add Update Delete Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;
  const getNodeByIdMock = vi.fn();
  const getEdgeByIdMock = vi.fn();

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      getNodeById: getNodeByIdMock,
      getEdgeById: getEdgeByIdMock,
      edgeRoutingManager: {
        computePointOnPath: vi.fn().mockImplementation((_routing, _points, percentage) => {
          // Simple mock implementation for testing
          if (percentage === 0) return { x: 0, y: 0 };
          if (percentage === 1) return { x: 100, y: 100 };
          return { x: 50, y: 50 };
        }),
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should add nodes to the flow', () => {
    const node1 = { ...mockNode, id: '1' };
    const node2 = { ...mockNode, id: '2' };

    commandHandler.emit('addNodes', { nodes: [node1, node2] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToAdd: [node1, node2] }, 'addNodes');
  });

  it('should update a node', () => {
    commandHandler.emit('updateNode', { id: '1', nodeChanges: { selected: true } });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToUpdate: [{ id: '1', selected: true }] }, 'updateNode');
  });

  it('should delete nodes from the flow with edges connected to them', () => {
    const node1 = { ...mockNode, id: '1', selected: true };
    const node2 = { ...mockNode, id: '2', selected: false };
    const edge = { ...mockEdge, id: '1', selected: false, source: '1', target: '2' };
    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [node1, node2],
      edges: [edge],
      metadata: {},
    });

    commandHandler.emit('deleteNodes', { ids: ['1'] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToRemove: ['1'], edgesToRemove: ['1'] }, 'deleteNodes');
  });

  it('should add edges to the flow', () => {
    const edge1 = { ...mockEdge, id: '1', selected: true };
    const edge2 = { ...mockEdge, id: '2', source: '1', target: '2', data: {} };

    commandHandler.emit('addEdges', { edges: [edge1, edge2] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edgesToAdd: [edge1, edge2] }, 'addEdges');
  });

  it('should update an edge', () => {
    commandHandler.emit('updateEdge', { id: '1', edgeChanges: { selected: true } });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edgesToUpdate: [{ id: '1', selected: true }] }, 'updateEdge');
  });

  it('should delete edges from the flow', () => {
    commandHandler.emit('deleteEdges', { ids: ['1'] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edgesToRemove: ['1'] }, 'deleteEdges');
  });

  it('should add ports to a node', () => {
    const node = { ...mockNode, id: '1' };
    const port = { ...mockPort, id: '1' };
    getNodeByIdMock.mockReturnValue(node);

    commandHandler.emit('addPorts', { nodeId: node.id, ports: [port] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToUpdate: [{ id: '1', ports: [port] }] }, 'updateNode');
  });

  it('should update ports', () => {
    getNodeByIdMock.mockReturnValue({
      ...mockNode,
      ports: [mockPort, { ...mockPort, id: 'port2' }, { ...mockPort, id: 'port3' }],
    });

    commandHandler.emit('updatePorts', {
      nodeId: mockNode.id,
      ports: [
        { portId: mockPort.id, portChanges: { size: { width: 100, height: 100 } } },
        { portId: 'port2', portChanges: { size: { width: 100, height: 100 } } },
      ],
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodesToUpdate: [
          {
            id: mockNode.id,
            ports: [
              { ...mockPort, size: { width: 100, height: 100 } },
              { ...mockPort, id: 'port2', size: { width: 100, height: 100 } },
              { ...mockPort, id: 'port3' },
            ],
          },
        ],
      },
      'updateNode'
    );
  });

  it('should delete ports from a node', () => {
    getNodeByIdMock.mockReturnValue({ ...mockNode, ports: [mockPort] });

    commandHandler.emit('deletePorts', { nodeId: mockNode.id, portIds: [mockPort.id] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToUpdate: [{ id: mockNode.id, ports: [] }] },
      'updateNode'
    );
  });

  it('should add edge labels to an edge and apply position on edge', () => {
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, labels: [] });

    commandHandler.emit('addEdgeLabels', {
      edgeId: mockEdge.id,
      labels: [mockEdgeLabel],
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [{ id: mockEdge.id, labels: [{ ...mockEdgeLabel, position: { x: 50, y: 50 } }] }],
      },
      'updateEdge'
    );
  });

  it('should update an edge label', () => {
    const mockEdgeLabel1 = { ...mockEdgeLabel, id: 'label1', positionOnEdge: 0.5 };
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, labels: [mockEdgeLabel1] });

    commandHandler.emit('updateEdgeLabel', {
      edgeId: mockEdge.id,
      labelId: mockEdgeLabel1.id,
      labelChanges: { positionOnEdge: 0 },
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [
          { id: mockEdge.id, labels: [{ ...mockEdgeLabel1, positionOnEdge: 0, position: { x: 0, y: 0 } }] },
        ],
      },
      'updateEdge'
    );
  });

  it('should delete an edge label', () => {
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, labels: [mockEdgeLabel, { ...mockEdgeLabel, id: 'label2' }] });

    commandHandler.emit('deleteEdgeLabels', {
      edgeId: mockEdge.id,
      labelIds: [mockEdgeLabel.id],
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [{ id: mockEdge.id, labels: [{ ...mockEdgeLabel, id: 'label2' }] }],
      },
      'updateEdge'
    );
  });
});
