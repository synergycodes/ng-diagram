import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionStateManager } from '../../action-state-manager/action-state-manager';
import { CommandHandler } from '../../command-handler/command-handler';
import { FlowCore } from '../../flow-core';
import { LabelBatchProcessor } from '../../label-batch-processor/label-batch-processor';
import { PortBatchProcessor } from '../../port-batch-processor/port-batch-processor';
import { mockEdge, mockEdgeLabel, mockNode, mockPort } from '../../test-utils';
import { InternalUpdater } from './internal-updater';

describe('InternalUpdater', () => {
  const getNodeByIdMock = vi.fn();
  const getEdgeByIdMock = vi.fn();
  const isResizing = vi.fn().mockReturnValue(false);
  let internalUpdater: InternalUpdater;
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;
  let portBatchProcessor: PortBatchProcessor;
  let labelBatchProcessor: LabelBatchProcessor;
  let actionStateManager: ActionStateManager;

  beforeEach(() => {
    commandHandler = {
      emit: vi.fn(),
    } as unknown as CommandHandler;
    portBatchProcessor = {
      processAdd: vi.fn(),
      processUpdate: vi.fn(),
    } as unknown as PortBatchProcessor;
    labelBatchProcessor = {
      processAdd: vi.fn(),
      processUpdate: vi.fn(),
    } as unknown as LabelBatchProcessor;
    actionStateManager = { isResizing } as unknown as ActionStateManager;
    flowCore = {
      getNodeById: getNodeByIdMock,
      getEdgeById: getEdgeByIdMock,
      commandHandler,
      portBatchProcessor,
      labelBatchProcessor,
      actionStateManager,
      config: { virtualization: { enabled: false } },
    } as unknown as FlowCore;
    internalUpdater = new InternalUpdater(flowCore);
  });

  describe('applyNodeSize', () => {
    it('should not call anything if size not changed', () => {
      getNodeByIdMock.mockReturnValue({
        ...mockNode,
        size: { width: 100, height: 100 },
      });

      internalUpdater.applyNodeSize('node-1', { width: 100, height: 100 });

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit resizeNode when size changes', () => {
      getNodeByIdMock.mockReturnValue({
        ...mockNode,
        size: { width: 100, height: 100 },
      });

      internalUpdater.applyNodeSize('node-1', { width: 5, height: 5 });

      expect(commandHandler.emit).toHaveBeenCalledWith('resizeNode', {
        id: 'node-1',
        size: { width: 5, height: 5 },
      });
    });

    it('should not call anything if node does not exist', () => {
      getNodeByIdMock.mockReturnValue(null);

      internalUpdater.applyNodeSize('node-1', { width: 5, height: 5 });

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should not call anything if manual resizing action is in progress', () => {
      getNodeByIdMock.mockReturnValue(null);
      isResizing.mockReturnValue(true);

      internalUpdater.applyNodeSize('node-1', { width: 5, height: 5 });

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });
  });

  describe('addPort', () => {
    it('should process port through portBatchProcessor', () => {
      portBatchProcessor.processAdd = vi.fn().mockImplementation((nodeId, port, callback) => {
        const allAdditions = new Map([[nodeId, [port]]]);
        callback(allAdditions);
      });

      internalUpdater.addPort('node-1', mockPort);

      expect(portBatchProcessor.processAdd).toHaveBeenCalledWith('node-1', mockPort, expect.any(Function));
    });

    it('should emit addPortsBulk when portBatchProcessor calls callback', () => {
      portBatchProcessor.processAdd = vi.fn().mockImplementation((nodeId, port, callback) => {
        const allAdditions = new Map([[nodeId, [port]]]);
        callback(allAdditions);
      });

      internalUpdater.addPort('node-1', mockPort);

      const expectedAdditions = new Map([['node-1', [mockPort]]]);
      expect(commandHandler.emit).toHaveBeenCalledWith('addPortsBulk', {
        additions: expectedAdditions,
      });
    });

    it('should skip addPort when port is already measured with size and position', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1', size: { width: 10, height: 10 }, position: { x: 5, y: 5 } }],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processAdd = vi.fn();

      internalUpdater.addPort('node-1', { ...mockPort, id: 'port-1' });

      expect(portBatchProcessor.processAdd).not.toHaveBeenCalled();
    });

    it('should proceed with addPort when port exists but has no size', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1', size: undefined, position: { x: 5, y: 5 } }],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processAdd = vi.fn();

      internalUpdater.addPort('node-1', { ...mockPort, id: 'port-1' });

      expect(portBatchProcessor.processAdd).toHaveBeenCalled();
    });

    it('should proceed with addPort when port is not in measuredPorts', () => {
      const node = {
        ...mockNode,
        measuredPorts: [],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processAdd = vi.fn();

      internalUpdater.addPort('node-1', { ...mockPort, id: 'port-1' });

      expect(portBatchProcessor.processAdd).toHaveBeenCalled();
    });
  });

  describe('applyPortChanges', () => {
    it('should not call portBatchProcessor if none of the ports are changed', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          { ...mockPort, id: 'port-1', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
          { ...mockPort, id: 'port-2', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
          { ...mockPort, id: 'port-3', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      internalUpdater.applyPortChanges('node-1', [
        { portId: 'port-1', portChanges: { size: { width: 100, height: 100 }, position: { x: 100, y: 100 } } },
        { portId: 'port-2', portChanges: { size: { width: 100, height: 100 }, position: { x: 100, y: 100 } } },
      ]);

      expect(portBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should process updates through portBatchProcessor for changed ports', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          { ...mockPort, id: 'port-1', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
          { ...mockPort, id: 'port-2', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
          { ...mockPort, id: 'port-3', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
          { ...mockPort, id: 'port-4', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn().mockImplementation((nodeId, portUpdate, callback) => {
        const allUpdates = new Map([[nodeId, [portUpdate]]]);
        callback(allUpdates);
      });

      internalUpdater.applyPortChanges('node-1', [
        { portId: 'port-1', portChanges: { size: { width: 50, height: 100 }, position: { x: 100, y: 100 } } },
        { portId: 'port-2', portChanges: { size: { width: 100, height: 100 }, position: { x: 50, y: 100 } } },
        { portId: 'port-3', portChanges: { size: { width: 100, height: 100 }, position: { x: 100, y: 100 } } },
      ]);

      expect(portBatchProcessor.processUpdate).toHaveBeenCalledTimes(2);
      expect(portBatchProcessor.processUpdate).toHaveBeenCalledWith(
        'node-1',
        { portId: 'port-1', portChanges: { size: { width: 50, height: 100 }, position: { x: 100, y: 100 } } },
        expect.any(Function)
      );
      expect(portBatchProcessor.processUpdate).toHaveBeenCalledWith(
        'node-1',
        { portId: 'port-2', portChanges: { size: { width: 100, height: 100 }, position: { x: 50, y: 100 } } },
        expect.any(Function)
      );
    });

    it('should emit updatePortsBulk when portBatchProcessor calls callback', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } }],
      };
      getNodeByIdMock.mockReturnValue(node);

      const portUpdates = [
        { portId: 'port-1', portChanges: { size: { width: 50, height: 100 }, position: { x: 100, y: 100 } } },
      ];
      portBatchProcessor.processUpdate = vi.fn().mockImplementation((nodeId, _, callback) => {
        const allUpdates = new Map([[nodeId, portUpdates]]);
        callback(allUpdates);
      });

      internalUpdater.applyPortChanges('node-1', [
        { portId: 'port-1', portChanges: { size: { width: 50, height: 100 }, position: { x: 100, y: 100 } } },
      ]);

      const expectedUpdates = new Map([['node-1', portUpdates]]);
      expect(commandHandler.emit).toHaveBeenCalledWith('updatePortsBulk', {
        updates: expectedUpdates,
      });
    });

    it('should not call anything if node does not exist', () => {
      getNodeByIdMock.mockReturnValue(null);

      internalUpdater.applyPortChanges('node-1', [
        { portId: 'port-1', portChanges: { size: { width: 50, height: 100 }, position: { x: 100, y: 100 } } },
      ]);

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should pass through side changes even when size/position are unchanged', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          {
            ...mockPort,
            id: 'port-1',
            side: 'top' as const,
            size: { width: 100, height: 100 },
            position: { x: 100, y: 100 },
          },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn().mockImplementation((nodeId, portUpdate, callback) => {
        const allUpdates = new Map([[nodeId, [portUpdate]]]);
        callback(allUpdates);
      });

      internalUpdater.applyPortChanges('node-1', [{ portId: 'port-1', portChanges: { side: 'bottom' } }]);

      expect(portBatchProcessor.processUpdate).toHaveBeenCalledWith(
        'node-1',
        { portId: 'port-1', portChanges: { side: 'bottom' } },
        expect.any(Function)
      );
    });

    it('should pass through type changes even when size/position are unchanged', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          {
            ...mockPort,
            id: 'port-1',
            type: 'source' as const,
            size: { width: 100, height: 100 },
            position: { x: 100, y: 100 },
          },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn().mockImplementation((nodeId, portUpdate, callback) => {
        const allUpdates = new Map([[nodeId, [portUpdate]]]);
        callback(allUpdates);
      });

      internalUpdater.applyPortChanges('node-1', [{ portId: 'port-1', portChanges: { type: 'target' } }]);

      expect(portBatchProcessor.processUpdate).toHaveBeenCalledWith(
        'node-1',
        { portId: 'port-1', portChanges: { type: 'target' } },
        expect.any(Function)
      );
    });

    it('should filter out side changes that match current state', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          {
            ...mockPort,
            id: 'port-1',
            side: 'top' as const,
            size: { width: 10, height: 10 },
            position: { x: 0, y: 0 },
          },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyPortChanges('node-1', [{ portId: 'port-1', portChanges: { side: 'top' } }]);

      expect(portBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should filter out type changes that match current state', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          {
            ...mockPort,
            id: 'port-1',
            type: 'source' as const,
            size: { width: 10, height: 10 },
            position: { x: 0, y: 0 },
          },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyPortChanges('node-1', [{ portId: 'port-1', portChanges: { type: 'source' } }]);

      expect(portBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should filter out undefined side so it does not overwrite a valid value', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          {
            ...mockPort,
            id: 'port-1',
            side: 'left' as const,
            size: { width: 10, height: 10 },
            position: { x: 0, y: 0 },
          },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyPortChanges('node-1', [{ portId: 'port-1', portChanges: { side: undefined } }]);

      expect(portBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should filter out undefined type so it does not overwrite a valid value', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          {
            ...mockPort,
            id: 'port-1',
            type: 'source' as const,
            size: { width: 10, height: 10 },
            position: { x: 0, y: 0 },
          },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyPortChanges('node-1', [{ portId: 'port-1', portChanges: { type: undefined } }]);

      expect(portBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should batch multiple side changes for the same node', () => {
      const node = {
        ...mockNode,
        measuredPorts: [
          {
            ...mockPort,
            id: 'port-1',
            side: 'top' as const,
            size: { width: 10, height: 10 },
            position: { x: 0, y: 0 },
          },
          {
            ...mockPort,
            id: 'port-2',
            side: 'bottom' as const,
            size: { width: 10, height: 10 },
            position: { x: 0, y: 0 },
          },
        ],
      };
      getNodeByIdMock.mockReturnValue(node);

      portBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyPortChanges('node-1', [
        { portId: 'port-1', portChanges: { side: 'left' } },
        { portId: 'port-2', portChanges: { side: 'right' } },
      ]);

      expect(portBatchProcessor.processUpdate).toHaveBeenCalledTimes(2);
      expect(portBatchProcessor.processUpdate).toHaveBeenCalledWith(
        'node-1',
        { portId: 'port-1', portChanges: { side: 'left' } },
        expect.any(Function)
      );
      expect(portBatchProcessor.processUpdate).toHaveBeenCalledWith(
        'node-1',
        { portId: 'port-2', portChanges: { side: 'right' } },
        expect.any(Function)
      );
    });
  });

  describe('addEdgeLabel', () => {
    it('should process label through labelBatchProcessor', () => {
      labelBatchProcessor.processAdd = vi.fn().mockImplementation((edgeId, label, callback) => {
        const allAdditions = new Map([[edgeId, [label]]]);
        callback(allAdditions);
      });

      internalUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(labelBatchProcessor.processAdd).toHaveBeenCalledWith('edge-1', mockEdgeLabel, expect.any(Function));
    });

    it('should emit addEdgeLabelsBulk when labelBatchProcessor calls callback', () => {
      labelBatchProcessor.processAdd = vi.fn().mockImplementation((edgeId, label, callback) => {
        const allAdditions = new Map([[edgeId, [label]]]);
        callback(allAdditions);
      });

      internalUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      const expectedAdditions = new Map([['edge-1', [mockEdgeLabel]]]);
      expect(commandHandler.emit).toHaveBeenCalledWith('addEdgeLabelsBulk', {
        additions: expectedAdditions,
      });
    });
  });

  describe('deleteEdgeLabel', () => {
    it('should process deletion through labelBatchProcessor', () => {
      labelBatchProcessor.processDelete = vi.fn();

      internalUpdater.deleteEdgeLabel('edge-1', 'label-1');

      expect(labelBatchProcessor.processDelete).toHaveBeenCalledWith('edge-1', 'label-1', expect.any(Function));
    });

    it('should emit deleteEdgeLabelsBulk when labelBatchProcessor calls callback', () => {
      labelBatchProcessor.processDelete = vi.fn().mockImplementation((edgeId, labelId, callback) => {
        const allDeletions = new Map([[edgeId, [labelId]]]);
        callback(allDeletions);
      });

      internalUpdater.deleteEdgeLabel('edge-1', 'label-1');

      const expectedDeletions = new Map([['edge-1', ['label-1']]]);
      expect(commandHandler.emit).toHaveBeenCalledWith('deleteEdgeLabelsBulk', {
        deletions: expectedDeletions,
      });
    });
  });

  describe('applyEdgeLabelChanges', () => {
    it('should not call anything if size is not changed', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: mockEdgeLabel.id, labelChanges: { size: { width: 100, height: 100 } } },
      ]);

      expect(labelBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should process update through labelBatchProcessor when size changes', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      labelBatchProcessor.processUpdate = vi.fn().mockImplementation((edgeId, labelUpdate, callback) => {
        const allUpdates = new Map([[edgeId, [labelUpdate]]]);
        callback(allUpdates);
      });

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: mockEdgeLabel.id, labelChanges: { size: { width: 50, height: 100 } } },
      ]);

      expect(labelBatchProcessor.processUpdate).toHaveBeenCalledWith(
        edge.id,
        { labelId: mockEdgeLabel.id, labelChanges: { size: { width: 50, height: 100 } } },
        expect.any(Function)
      );
    });

    it('should emit updateEdgeLabelsBulk when labelBatchProcessor calls callback', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      const labelUpdates = [{ labelId: mockEdgeLabel.id, labelChanges: { size: { width: 50, height: 100 } } }];
      labelBatchProcessor.processUpdate = vi.fn().mockImplementation((edgeId, _, callback) => {
        const allUpdates = new Map([[edgeId, labelUpdates]]);
        callback(allUpdates);
      });

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: mockEdgeLabel.id, labelChanges: { size: { width: 50, height: 100 } } },
      ]);

      const expectedUpdates = new Map([[edge.id, labelUpdates]]);
      expect(commandHandler.emit).toHaveBeenCalledWith('updateEdgeLabelsBulk', {
        updates: expectedUpdates,
      });
    });

    it('should not call anything if edge does not exist', () => {
      getEdgeByIdMock.mockReturnValue(null);

      internalUpdater.applyEdgeLabelChanges('edge-1', [
        { labelId: 'label-1', labelChanges: { size: { width: 50, height: 100 } } },
      ]);

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should not call anything if label does not exist', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: 'non-existent-label', labelChanges: { size: { width: 50, height: 100 } } },
      ]);

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should pass through positionOnEdge changes even when size is unchanged', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      labelBatchProcessor.processUpdate = vi.fn().mockImplementation((edgeId, labelUpdate, callback) => {
        const allUpdates = new Map([[edgeId, [labelUpdate]]]);
        callback(allUpdates);
      });

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: mockEdgeLabel.id, labelChanges: { positionOnEdge: 0.75 } },
      ]);

      expect(labelBatchProcessor.processUpdate).toHaveBeenCalledWith(
        edge.id,
        { labelId: mockEdgeLabel.id, labelChanges: { positionOnEdge: 0.75 } },
        expect.any(Function)
      );
    });

    it('should filter out positionOnEdge changes that match current state', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, positionOnEdge: 0.5, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      labelBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: mockEdgeLabel.id, labelChanges: { positionOnEdge: 0.5 } },
      ]);

      expect(labelBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should filter out undefined size so it does not cause redundant emits', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: undefined }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      labelBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: mockEdgeLabel.id, labelChanges: { size: undefined } },
      ]);

      expect(labelBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should filter out undefined positionOnEdge so it does not overwrite a valid value', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, positionOnEdge: 0.5, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      labelBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: mockEdgeLabel.id, labelChanges: { positionOnEdge: undefined } },
      ]);

      expect(labelBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should batch multiple label changes for the same edge', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [
          { ...mockEdgeLabel, id: 'label-1', size: { width: 100, height: 100 } },
          { ...mockEdgeLabel, id: 'label-2', size: { width: 100, height: 100 } },
        ],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      labelBatchProcessor.processUpdate = vi.fn();

      internalUpdater.applyEdgeLabelChanges(edge.id, [
        { labelId: 'label-1', labelChanges: { positionOnEdge: 0.25 } },
        { labelId: 'label-2', labelChanges: { positionOnEdge: 0.75 } },
      ]);

      expect(labelBatchProcessor.processUpdate).toHaveBeenCalledTimes(2);
      expect(labelBatchProcessor.processUpdate).toHaveBeenCalledWith(
        edge.id,
        { labelId: 'label-1', labelChanges: { positionOnEdge: 0.25 } },
        expect.any(Function)
      );
      expect(labelBatchProcessor.processUpdate).toHaveBeenCalledWith(
        edge.id,
        { labelId: 'label-2', labelChanges: { positionOnEdge: 0.75 } },
        expect.any(Function)
      );
    });
  });
});
