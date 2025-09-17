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
        callback(nodeId, [port]);
      });

      internalUpdater.addPort('node-1', mockPort);

      expect(portBatchProcessor.processAdd).toHaveBeenCalledWith('node-1', mockPort, expect.any(Function));
    });

    it('should emit addPorts when portBatchProcessor calls callback', () => {
      portBatchProcessor.processAdd = vi.fn().mockImplementation((nodeId, port, callback) => {
        callback(nodeId, [port]);
      });

      internalUpdater.addPort('node-1', mockPort);

      expect(commandHandler.emit).toHaveBeenCalledWith('addPorts', {
        nodeId: 'node-1',
        ports: [mockPort],
      });
    });
  });

  describe('applyPortsSizesAndPositions', () => {
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

      internalUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
        { id: 'port-2', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
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
        callback(nodeId, [portUpdate]);
      });

      internalUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 50, height: 100 }, position: { x: 100, y: 100 } },
        { id: 'port-2', size: { width: 100, height: 100 }, position: { x: 50, y: 100 } },
        { id: 'port-3', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
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

    it('should emit updatePorts when portBatchProcessor calls callback', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } }],
      };
      getNodeByIdMock.mockReturnValue(node);

      const portUpdates = [
        { portId: 'port-1', portChanges: { size: { width: 50, height: 100 }, position: { x: 100, y: 100 } } },
      ];
      portBatchProcessor.processUpdate = vi.fn().mockImplementation((nodeId, _, callback) => {
        callback(nodeId, portUpdates);
      });

      internalUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 50, height: 100 }, position: { x: 100, y: 100 } },
      ]);

      expect(commandHandler.emit).toHaveBeenCalledWith('updatePorts', {
        nodeId: 'node-1',
        ports: portUpdates,
      });
    });

    it('should not call anything if node does not exist', () => {
      getNodeByIdMock.mockReturnValue(null);

      internalUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 50, height: 100 }, position: { x: 100, y: 100 } },
      ]);

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });
  });

  describe('addEdgeLabel', () => {
    it('should process label through labelBatchProcessor', () => {
      labelBatchProcessor.processAdd = vi.fn().mockImplementation((edgeId, label, callback) => {
        callback(edgeId, [label]);
      });

      internalUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(labelBatchProcessor.processAdd).toHaveBeenCalledWith('edge-1', mockEdgeLabel, expect.any(Function));
    });

    it('should emit addEdgeLabels when labelBatchProcessor calls callback', () => {
      labelBatchProcessor.processAdd = vi.fn().mockImplementation((edgeId, label, callback) => {
        callback(edgeId, [label]);
      });

      internalUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(commandHandler.emit).toHaveBeenCalledWith('addEdgeLabels', {
        edgeId: 'edge-1',
        labels: [mockEdgeLabel],
      });
    });
  });

  describe('applyEdgeLabelSize', () => {
    it('should not call anything if size is not changed', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelSize(edge.id, mockEdgeLabel.id, { width: 100, height: 100 });

      expect(labelBatchProcessor.processUpdate).not.toHaveBeenCalled();
    });

    it('should process update through labelBatchProcessor when size changes', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      labelBatchProcessor.processUpdate = vi.fn().mockImplementation((edgeId, labelUpdate, callback) => {
        callback(edgeId, [labelUpdate]);
      });

      internalUpdater.applyEdgeLabelSize(edge.id, mockEdgeLabel.id, { width: 50, height: 100 });

      expect(labelBatchProcessor.processUpdate).toHaveBeenCalledWith(
        edge.id,
        { labelId: mockEdgeLabel.id, labelChanges: { size: { width: 50, height: 100 } } },
        expect.any(Function)
      );
    });

    it('should emit updateEdgeLabels when labelBatchProcessor calls callback', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      const labelUpdates = [{ labelId: mockEdgeLabel.id, labelChanges: { size: { width: 50, height: 100 } } }];
      labelBatchProcessor.processUpdate = vi.fn().mockImplementation((edgeId, _, callback) => {
        callback(edgeId, labelUpdates);
      });

      internalUpdater.applyEdgeLabelSize(edge.id, mockEdgeLabel.id, { width: 50, height: 100 });

      expect(commandHandler.emit).toHaveBeenCalledWith('updateEdgeLabels', {
        edgeId: edge.id,
        labelUpdates: labelUpdates,
      });
    });

    it('should not call anything if edge does not exist', () => {
      getEdgeByIdMock.mockReturnValue(null);

      internalUpdater.applyEdgeLabelSize('edge-1', 'label-1', { width: 50, height: 100 });

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should not call anything if label does not exist', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelSize(edge.id, 'non-existent-label', { width: 50, height: 100 });

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });
  });
});
