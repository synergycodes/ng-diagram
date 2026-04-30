import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEdge, mockEdgeLabel, mockNode } from '../../../test-utils';
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
      config: {
        snapping: {
          shouldSnapDragForNode: () => false,
          computeSnapForNodeDrag: () => null,
          defaultDragSnap: { width: 10, height: 10 },
        },
      },
      edgeRoutingManager: {
        computePointOnPath: vi.fn().mockImplementation((_routing, _points, percentage) => {
          // Simple mock implementation for testing
          if (percentage === 0) return { x: 0, y: 0 };
          if (percentage === 1) return { x: 100, y: 100 };
          return { x: 50, y: 50 };
        }),
        computePointAtDistance: vi.fn().mockImplementation((_routing, _points, distancePx) => {
          return { x: Math.abs(distancePx), y: 0 };
        }),
      },
      transactionManager: {
        isActive: vi.fn().mockReturnValue(false),
        getCurrentTransaction: vi.fn(),
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

  it('should add a node dropped from palette', () => {
    const node = { ...mockNode, id: 'palette-node-1', position: { x: 150, y: 200 } };

    commandHandler.emit('paletteDropNode', { node });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToAdd: [node] }, 'paletteDropNode');
  });

  it('should add a node from palette with specific type', () => {
    const node = {
      ...mockNode,
      id: 'custom-1',
      type: 'custom-type',
      position: { x: 100, y: 100 },
      data: { label: 'Custom Node' },
    };

    commandHandler.emit('paletteDropNode', { node });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToAdd: [node] }, 'paletteDropNode');
  });

  it('should snap palette drop position when snapping is enabled', () => {
    flowCore.config.snapping.shouldSnapDragForNode = () => true;
    flowCore.config.snapping.computeSnapForNodeDrag = () => null;
    flowCore.config.snapping.defaultDragSnap = { width: 20, height: 20 };

    const node = { ...mockNode, id: 'snap-1', position: { x: 153, y: 207 } };

    commandHandler.emit('paletteDropNode', { node });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToAdd: [{ ...node, position: { x: 160, y: 200 } }] },
      'paletteDropNode'
    );
  });

  it('should use computeSnapForNodeDrag when provided for palette drop', () => {
    flowCore.config.snapping.shouldSnapDragForNode = () => true;
    flowCore.config.snapping.computeSnapForNodeDrag = () => ({ width: 50, height: 50 });
    flowCore.config.snapping.defaultDragSnap = { width: 10, height: 10 };

    const node = { ...mockNode, id: 'snap-2', position: { x: 123, y: 167 } };

    commandHandler.emit('paletteDropNode', { node });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToAdd: [{ ...node, position: { x: 100, y: 150 } }] },
      'paletteDropNode'
    );
  });

  it('should update a node', () => {
    commandHandler.emit('updateNode', { id: '1', nodeChanges: { selected: true } });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToUpdate: [{ id: '1', selected: true }] }, 'updateNode');
  });

  it('should update multiple nodes', () => {
    const updates = [
      { id: '1', selected: true },
      { id: '2', selected: false, position: { x: 100, y: 200 } },
    ];

    commandHandler.emit('updateNodes', { nodes: updates });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ nodesToUpdate: updates }, 'updateNodes');
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

  it('should update multiple edges', () => {
    const updates = [
      { id: '1', selected: true },
      { id: '2', selected: false, data: { label: 'Updated' } },
    ];

    commandHandler.emit('updateEdges', { edges: updates });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edgesToUpdate: updates }, 'updateEdges');
  });

  it('should delete edges from the flow', () => {
    commandHandler.emit('deleteEdges', { ids: ['1'] });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ edgesToRemove: ['1'] }, 'deleteEdges');
  });

  it('should clear the entire model', () => {
    const node1 = { ...mockNode, id: '1', selected: true };
    const node2 = { ...mockNode, id: '2', selected: false };
    const edge = { ...mockEdge, id: '1', selected: false, source: '1', target: '2' };
    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [node1, node2],
      edges: [edge],
      metadata: {},
    });
    commandHandler.emit('clearModel');

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { nodesToRemove: ['1', '2'], edgesToRemove: ['1'] },
      'clearModel'
    );
  });

  it('should add edge labels without resolving position (deferred to edge routing middleware)', () => {
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, measuredLabels: [] });

    commandHandler.emit('addEdgeLabelsBulk', {
      additions: new Map([[mockEdge.id, [mockEdgeLabel]]]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [{ id: mockEdge.id, measuredLabels: [mockEdgeLabel] }],
      },
      'addEdgeLabelsBulk'
    );
  });

  it('should update an edge label', () => {
    const mockEdgeLabel1 = { ...mockEdgeLabel, id: 'label1', positionOnEdge: 0.5 };
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, measuredLabels: [mockEdgeLabel1] });

    commandHandler.emit('updateEdgeLabelsBulk', {
      updates: new Map([[mockEdge.id, [{ labelId: mockEdgeLabel1.id, labelChanges: { positionOnEdge: 0 } }]]]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [
          { id: mockEdge.id, measuredLabels: [{ ...mockEdgeLabel1, positionOnEdge: 0, position: { x: 0, y: 0 } }] },
        ],
      },
      'updateEdgeLabelsBulk'
    );
  });

  it('should preserve existing label positions when edge has no valid points', () => {
    const existingLabel = { ...mockEdgeLabel, id: 'label1', positionOnEdge: 0.5, position: { x: 10, y: 20 } };
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, points: [], measuredLabels: [existingLabel] });

    commandHandler.emit('updateEdgeLabelsBulk', {
      updates: new Map([[mockEdge.id, [{ labelId: existingLabel.id, labelChanges: { positionOnEdge: 0.75 } }]]]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [
          {
            id: mockEdge.id,
            measuredLabels: [{ ...existingLabel, positionOnEdge: 0.75, position: { x: 10, y: 20 } }],
          },
        ],
      },
      'updateEdgeLabelsBulk'
    );
  });

  it('should return unchanged labels by reference when edge has no valid points', () => {
    const label1 = { ...mockEdgeLabel, id: 'label1', positionOnEdge: 0.5, position: { x: 10, y: 20 } };
    const label2 = { ...mockEdgeLabel, id: 'label2', positionOnEdge: 0.75, position: { x: 30, y: 40 } };
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, points: [], measuredLabels: [label1, label2] });

    commandHandler.emit('updateEdgeLabelsBulk', {
      updates: new Map([[mockEdge.id, [{ labelId: label1.id, labelChanges: { positionOnEdge: 0.25 } }]]]),
    });

    const call = vi.mocked(flowCore.applyUpdate).mock.calls[0];
    const updatedLabels = (call[0] as { edgesToUpdate: { measuredLabels: unknown[] }[] }).edgesToUpdate[0]
      .measuredLabels;

    // label2 has no changes and no valid points — should be the same reference
    expect(updatedLabels[1]).toBe(label2);
  });

  it('should recalculate unchanged label positions when edge has valid points', () => {
    const label1 = { ...mockEdgeLabel, id: 'label1', positionOnEdge: 0.5, position: { x: 10, y: 20 } };
    const label2 = { ...mockEdgeLabel, id: 'label2', positionOnEdge: 0.75, position: { x: 30, y: 40 } };
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, measuredLabels: [label1, label2] });

    commandHandler.emit('updateEdgeLabelsBulk', {
      updates: new Map([[mockEdge.id, [{ labelId: label1.id, labelChanges: { positionOnEdge: 0 } }]]]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [
          {
            id: mockEdge.id,
            measuredLabels: [
              { ...label1, positionOnEdge: 0, position: { x: 0, y: 0 } },
              { ...label2, position: { x: 50, y: 50 } },
            ],
          },
        ],
      },
      'updateEdgeLabelsBulk'
    );
  });

  it('should add edge labels with absolute position without resolving (deferred to edge routing middleware)', () => {
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, measuredLabels: [] });

    const absoluteLabel = { ...mockEdgeLabel, id: 'abs-label', positionOnEdge: '30px' as const };
    commandHandler.emit('addEdgeLabelsBulk', {
      additions: new Map([[mockEdge.id, [absoluteLabel]]]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [{ id: mockEdge.id, measuredLabels: [absoluteLabel] }],
      },
      'addEdgeLabelsBulk'
    );
  });

  it('should update an edge label to absolute position', () => {
    const mockEdgeLabel1 = { ...mockEdgeLabel, id: 'label1', positionOnEdge: 0.5 };
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, measuredLabels: [mockEdgeLabel1] });

    commandHandler.emit('updateEdgeLabelsBulk', {
      updates: new Map([
        [mockEdge.id, [{ labelId: mockEdgeLabel1.id, labelChanges: { positionOnEdge: '20px' as const } }]],
      ]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [
          {
            id: mockEdge.id,
            measuredLabels: [{ ...mockEdgeLabel1, positionOnEdge: '20px', position: { x: 20, y: 0 } }],
          },
        ],
      },
      'updateEdgeLabelsBulk'
    );
  });

  it('should update an edge label with negative absolute position', () => {
    const mockEdgeLabel1 = { ...mockEdgeLabel, id: 'label1', positionOnEdge: 0.5 };
    getEdgeByIdMock.mockReturnValue({ ...mockEdge, measuredLabels: [mockEdgeLabel1] });

    commandHandler.emit('updateEdgeLabelsBulk', {
      updates: new Map([
        [mockEdge.id, [{ labelId: mockEdgeLabel1.id, labelChanges: { positionOnEdge: '-20px' as const } }]],
      ]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [
          {
            id: mockEdge.id,
            measuredLabels: [{ ...mockEdgeLabel1, positionOnEdge: '-20px', position: { x: 20, y: 0 } }],
          },
        ],
      },
      'updateEdgeLabelsBulk'
    );
  });

  it('should delete an edge label', () => {
    getEdgeByIdMock.mockReturnValue({
      ...mockEdge,
      measuredLabels: [mockEdgeLabel, { ...mockEdgeLabel, id: 'label2' }],
    });

    commandHandler.emit('deleteEdgeLabelsBulk', {
      deletions: new Map([[mockEdge.id, [mockEdgeLabel.id]]]),
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToUpdate: [{ id: mockEdge.id, measuredLabels: [{ ...mockEdgeLabel, id: 'label2' }] }],
      },
      'deleteEdgeLabelsBulk'
    );
  });
});
