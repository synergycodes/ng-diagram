import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandHandler } from '../command-handler/command-handler';
import { FlowCore } from '../flow-core';
import { InitializationGuard } from '../initialization-guard/initialization-guard';
import { mockEdge, mockEdgeLabel, mockNode, mockPort } from '../test-utils';
import { InternalUpdater } from './internal-updater';

describe('InternalUpdater', () => {
  const getNodeByIdMock = vi.fn();
  const getEdgeByIdMock = vi.fn();
  let internalUpdater: InternalUpdater;
  let initializationGuard: InitializationGuard;
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    commandHandler = {
      emit: vi.fn(),
    } as unknown as CommandHandler;
    initializationGuard = {
      isInitialized: false,
      initNodeSize: vi.fn(),
      addEdgeLabel: vi.fn(),
      initEdgeLabelSize: vi.fn(),
      initPortSizeAndPosition: vi.fn(),
      addPort: vi.fn(),
    } as unknown as InitializationGuard;
    flowCore = {
      getNodeById: getNodeByIdMock,
      getEdgeById: getEdgeByIdMock,
      initializationGuard,
      commandHandler,
    } as unknown as FlowCore;
    internalUpdater = new InternalUpdater(flowCore);
  });

  describe('applyNodeSize', () => {
    it('should not call anything is size not changed', () => {
      getNodeByIdMock.mockReturnValue({
        ...mockNode,
        size: { width: 100, height: 100 },
      });

      internalUpdater.applyNodeSize('node-1', { size: { width: 100, height: 100 } });

      expect(initializationGuard.initNodeSize).not.toHaveBeenCalled();
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should call initNodeSize if flow is not initialized', () => {
      internalUpdater.applyNodeSize('node-1', { size: { width: 5, height: 5 } });

      expect(initializationGuard.initNodeSize).toHaveBeenCalledWith('node-1', { width: 5, height: 5 });
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit resizeNode if flow is initialized', () => {
      getNodeByIdMock.mockReturnValue({
        ...mockNode,
        size: { width: 100, height: 100 },
      });
      initializationGuard.isInitialized = true;

      internalUpdater.applyNodeSize('node-1', { size: { width: 5, height: 5 } });

      expect(commandHandler.emit).toHaveBeenCalledWith('resizeNode', {
        id: 'node-1',
        size: { width: 5, height: 5 },
      });
    });
  });

  describe('addPort', () => {
    it('should call addPort from initializationGuard if flow is not initialized', () => {
      internalUpdater.addPort('node-1', mockPort);

      expect(initializationGuard.addPort).toHaveBeenCalledWith('node-1', mockPort);
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit addPorts if flow is initialized', () => {
      initializationGuard.isInitialized = true;

      internalUpdater.addPort('node-1', mockPort);

      expect(commandHandler.emit).toHaveBeenCalledWith('addPorts', { nodeId: 'node-1', ports: [mockPort] });
    });
  });

  describe('applyPortsSizesAndPositions', () => {
    it('should not call anything if none of the ports are changed', () => {
      const node = {
        ...mockNode,
        ports: [
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

      expect(initializationGuard.initPortSizeAndPosition).not.toHaveBeenCalled();
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should call initPortSizeAndPosition for every port that is changed from initializationGuard if flow is not initialized', () => {
      const node = {
        ...mockNode,
        ports: [
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

      expect(initializationGuard.initPortSizeAndPosition).toHaveBeenCalledWith(
        'node-1',
        'port-1',
        { width: 50, height: 100 },
        { x: 100, y: 100 }
      );
      expect(initializationGuard.initPortSizeAndPosition).toHaveBeenCalledWith(
        'node-1',
        'port-2',
        { width: 100, height: 100 },
        { x: 50, y: 100 }
      );
      expect(initializationGuard.initPortSizeAndPosition).toHaveBeenCalledTimes(2);
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit updatePorts if flow is initialized', () => {
      initializationGuard.isInitialized = true;

      const node = {
        ...mockNode,
        ports: [
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
      expect(initializationGuard.initPortSizeAndPosition).not.toHaveBeenCalled();
    });
  });

  describe('addEdgeLabel', () => {
    it('should call addEdgeLabel from initializationGuard if flow is not initialized', () => {
      internalUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(initializationGuard.addEdgeLabel).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit addEdgeLabels if flow is initialized', () => {
      initializationGuard.isInitialized = true;

      internalUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(commandHandler.emit).toHaveBeenCalledWith('addEdgeLabels', { edgeId: 'edge-1', labels: [mockEdgeLabel] });
      expect(initializationGuard.addEdgeLabel).not.toHaveBeenCalled();
    });
  });

  describe('applyEdgeLabelSize', () => {
    it('should not call anything if size is not changed', () => {
      const edge = {
        ...mockEdge,
        labels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelSize(edge.id, mockEdgeLabel.id, { width: 100, height: 100 });

      expect(initializationGuard.initEdgeLabelSize).not.toHaveBeenCalled();
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should call initEdgeLabelSize if flow is not initialized', () => {
      const edge = {
        ...mockEdge,
        labels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelSize(edge.id, mockEdgeLabel.id, { width: 50, height: 100 });

      expect(initializationGuard.initEdgeLabelSize).toHaveBeenCalledWith(edge.id, mockEdgeLabel.id, {
        width: 50,
        height: 100,
      });
      expect(commandHandler.emit).not.toHaveBeenCalled();
    });

    it('should emit updateEdgeLabel if flow is initialized', () => {
      initializationGuard.isInitialized = true;

      const edge = {
        ...mockEdge,
        labels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }],
      };
      getEdgeByIdMock.mockReturnValue(edge);

      internalUpdater.applyEdgeLabelSize(edge.id, mockEdgeLabel.id, { width: 50, height: 100 });

      expect(commandHandler.emit).toHaveBeenCalledWith('updateEdgeLabel', {
        edgeId: edge.id,
        labelId: mockEdgeLabel.id,
        labelChanges: { size: { width: 50, height: 100 } },
      });
      expect(initializationGuard.initEdgeLabelSize).not.toHaveBeenCalled();
    });
  });
});
