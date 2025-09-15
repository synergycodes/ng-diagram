import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionStateManager } from '../../action-state-manager/action-state-manager';
import { CommandHandler } from '../../command-handler/command-handler';
import { FlowCore } from '../../flow-core';
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
  let actionStateManager: ActionStateManager;

  beforeEach(() => {
    commandHandler = {
      emit: vi.fn(),
    } as unknown as CommandHandler;
    portBatchProcessor = {
      process: vi.fn(),
    } as unknown as PortBatchProcessor;
    actionStateManager = { isResizing } as unknown as ActionStateManager;
    flowCore = {
      getNodeById: getNodeByIdMock,
      getEdgeById: getEdgeByIdMock,
      commandHandler,
      portBatchProcessor,
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
      portBatchProcessor.process = vi.fn().mockImplementation((nodeId, port, callback) => {
        callback(nodeId, [port]);
      });

      internalUpdater.addPort('node-1', mockPort);

      expect(portBatchProcessor.process).toHaveBeenCalledWith('node-1', mockPort, expect.any(Function));
    });

    it('should emit addPorts when portBatchProcessor calls callback', () => {
      portBatchProcessor.process = vi.fn().mockImplementation((nodeId, port, callback) => {
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
    it('should emit updatePorts with empty array if none of the ports are changed', () => {
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

      expect(commandHandler.emit).toHaveBeenCalledWith('updatePorts', {
        nodeId: 'node-1',
        ports: [],
      });
    });

    it('should emit updatePorts for changed ports', () => {
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

      internalUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 50, height: 100 }, position: { x: 100, y: 100 } },
        { id: 'port-2', size: { width: 100, height: 100 }, position: { x: 50, y: 100 } },
        { id: 'port-3', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } },
      ]);

      expect(commandHandler.emit).toHaveBeenCalledWith('updatePorts', {
        nodeId: 'node-1',
        ports: [
          { portId: 'port-1', portChanges: { size: { width: 50, height: 100 }, position: { x: 100, y: 100 } } },
          { portId: 'port-2', portChanges: { size: { width: 100, height: 100 }, position: { x: 50, y: 100 } } },
        ],
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
    it('should emit addEdgeLabels', () => {
      internalUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(commandHandler.emit).toHaveBeenCalledWith('addEdgeLabels', { edgeId: 'edge-1', labels: [mockEdgeLabel] });
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

      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit updateEdgeLabel when size changes', () => {
      const edge = {
        ...mockEdge,
        measuredLabels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelSize(edge.id, mockEdgeLabel.id, { width: 50, height: 100 });

      expect(commandHandler.emit).toHaveBeenCalledWith('updateEdgeLabel', {
        edgeId: edge.id,
        labelId: mockEdgeLabel.id,
        labelChanges: { size: { width: 50, height: 100 } },
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
