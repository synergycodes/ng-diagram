import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../flow-core';
import { mockEdgeLabel, mockNode, mockPort } from '../../test-utils';
import { InitUpdater } from './init-updater';
import { BatchInitializer } from './batch-initializer';

// Mock BatchInitializer
vi.mock(import('./batch-initializer'), () => ({ BatchInitializer: vi.fn() }));
BatchInitializer.prototype.waitForFinish = vi.fn();
BatchInitializer.prototype.init = vi.fn(() => Promise.resolve());
BatchInitializer.prototype.scheduleInit = vi.fn();

describe('InitUpdater', () => {
  const stateMock = { nodes: [], edges: [], metadata: {} };
  const getStateMock = vi.fn();
  const setStateMock = vi.fn();
  let flowCore: FlowCore;
  let initUpdater: InitUpdater;

  beforeEach(() => {
    flowCore = {
      getState: getStateMock,
      setState: setStateMock,
      getNodeById: vi.fn(),
    } as unknown as FlowCore;

    getStateMock.mockReturnValue(stateMock);
    vi.clearAllMocks();

    initUpdater = new InitUpdater(flowCore);
  });

  describe('constructor', () => {
    it('should initialize with isInitialized as false', () => {
      expect(initUpdater.isInitialized).toBe(false);
    });

    it('should create batch initializers', () => {
      expect(BatchInitializer).toHaveBeenCalledTimes(5);
    });
  });

  describe('start', () => {
    it('should wait for all initializers to finish and set isInitialized to true', async () => {
      await initUpdater.start();

      expect(BatchInitializer).toHaveBeenCalledTimes(5);
      expect(initUpdater.isInitialized).toBe(true);
    });
  });

  describe('applyNodeSize', () => {
    it('should schedule node size initialization', () => {
      const size = { width: 100, height: 100 };

      initUpdater.applyNodeSize('node-1', size);

      expect(BatchInitializer.prototype.scheduleInit).toHaveBeenCalledWith('node-1', size);
    });
  });

  describe('addPort', () => {
    it('should schedule port initialization with compound id', () => {
      initUpdater.addPort('node-1', mockPort);

      expect(BatchInitializer.prototype.scheduleInit).toHaveBeenCalledWith(`node-1->${mockPort.id}`, mockPort);
    });
  });

  describe('applyPortsSizesAndPositions', () => {
    it('should not schedule anything if node does not exist', () => {
      vi.mocked(flowCore.getNodeById).mockReturnValue(null);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 100, height: 100 }, position: { x: 0, y: 0 } },
      ]);

      expect(BatchInitializer.prototype.scheduleInit).not.toHaveBeenCalled();
    });

    it('should schedule port rect initialization for changed ports', () => {
      const node = {
        ...mockNode,
        ports: [{ ...mockPort, id: 'port-1', size: { width: 50, height: 50 }, position: { x: 0, y: 0 } }],
      };
      vi.mocked(flowCore.getNodeById).mockReturnValue(node);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 100, height: 100 }, position: { x: 10, y: 10 } },
      ]);

      expect(BatchInitializer.prototype.scheduleInit).toHaveBeenCalledWith('node-1->port-1', {
        width: 100,
        height: 100,
        x: 10,
        y: 10,
      });
    });

    it('should not schedule anything for ports without size or position', () => {
      const node = {
        ...mockNode,
        ports: [{ ...mockPort, id: 'port-1', size: { width: 50, height: 50 }, position: { x: 0, y: 0 } }],
      };
      vi.mocked(flowCore.getNodeById).mockReturnValue(node);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: undefined, position: { x: 10, y: 10 } } as NonNullable<
          Pick<{ id: string; size: undefined; position: { x: number; y: number } }, 'id' | 'size' | 'position'>
        >,
      ]);

      expect(BatchInitializer.prototype.scheduleInit).not.toHaveBeenCalled();
    });
  });

  describe('addEdgeLabel', () => {
    it('should schedule edge label initialization', () => {
      initUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(BatchInitializer.prototype.scheduleInit).toHaveBeenCalledWith('edge-1', mockEdgeLabel);
    });
  });

  describe('applyEdgeLabelSize', () => {
    it('should schedule edge label size initialization with compound id', () => {
      const size = { width: 100, height: 100 };

      initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      expect(BatchInitializer.prototype.scheduleInit).toHaveBeenCalledWith('edge-1->label-1', size);
    });
  });
});
