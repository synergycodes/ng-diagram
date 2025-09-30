import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../flow-core';
import { mockEdgeLabel, mockNode, mockPort } from '../../test-utils';
import { BatchInitializer } from './batch-initializer';
import { InitUpdater } from './init-updater';

// Mock BatchInitializer
vi.mock(import('./batch-initializer'), () => ({ BatchInitializer: vi.fn() }));
BatchInitializer.prototype.waitForFinish = vi.fn(() => Promise.resolve());
BatchInitializer.prototype.init = vi.fn();
BatchInitializer.prototype.batchChange = vi.fn();

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
    it('should call waitForFinish on all initializers and eventually set isInitialized', async () => {
      const onCompleteMock = vi.fn();

      initUpdater.start(onCompleteMock);

      // waitForFinish should be called for each initializer
      expect(BatchInitializer.prototype.waitForFinish).toHaveBeenCalledTimes(5);

      // Initially, isInitialized should still be false (async)
      expect(initUpdater.isInitialized).toBe(false);

      // Wait for promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      // After promises resolve, isInitialized should be true and callback called
      expect(initUpdater.isInitialized).toBe(true);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization failure and still call onComplete', async () => {
      const onCompleteMock = vi.fn();
      const error = new Error('Initialization failed');

      // Make one initializer fail
      BatchInitializer.prototype.waitForFinish = vi
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(error)
        .mockResolvedValue(undefined);

      // Spy on console.error
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      initUpdater.start(onCompleteMock);

      // Wait for promises to resolve/reject
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should still set isInitialized and call callback even on error
      expect(initUpdater.isInitialized).toBe(true);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Initialization failed:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should work without onComplete callback', async () => {
      initUpdater.start(); // No callback

      // Wait for promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Should still set isInitialized
      expect(initUpdater.isInitialized).toBe(true);
    });
  });

  describe('applyNodeSize', () => {
    it('should schedule node size initialization', () => {
      const size = { width: 100, height: 100 };

      initUpdater.applyNodeSize('node-1', size);

      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith('node-1', size);
    });
  });

  describe('addPort', () => {
    it('should schedule port initialization with compound id', () => {
      initUpdater.addPort('node-1', mockPort);

      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith(`node-1->${mockPort.id}`, mockPort);
    });
  });

  describe('applyPortsSizesAndPositions', () => {
    it('should not schedule anything if node does not exist', () => {
      vi.mocked(flowCore.getNodeById).mockReturnValue(null);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 100, height: 100 }, position: { x: 0, y: 0 } },
      ]);

      expect(BatchInitializer.prototype.batchChange).not.toHaveBeenCalled();
    });

    it('should schedule port rect initialization for changed ports', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1', size: { width: 50, height: 50 }, position: { x: 0, y: 0 } }],
      };
      vi.mocked(flowCore.getNodeById).mockReturnValue(node);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: { width: 100, height: 100 }, position: { x: 10, y: 10 } },
      ]);

      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith('node-1->port-1', {
        width: 100,
        height: 100,
        x: 10,
        y: 10,
      });
    });

    it('should not schedule anything for ports without size or position', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1', size: { width: 50, height: 50 }, position: { x: 0, y: 0 } }],
      };
      vi.mocked(flowCore.getNodeById).mockReturnValue(node);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: undefined, position: { x: 10, y: 10 } } as NonNullable<
          Pick<{ id: string; size: undefined; position: { x: number; y: number } }, 'id' | 'size' | 'position'>
        >,
      ]);

      expect(BatchInitializer.prototype.batchChange).not.toHaveBeenCalled();
    });
  });

  describe('addEdgeLabel', () => {
    it('should schedule edge label initialization with compound id', () => {
      initUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith(`edge-1->${mockEdgeLabel.id}`, mockEdgeLabel);
    });

    it('should handle multiple labels for the same edge', () => {
      const label1 = { ...mockEdgeLabel, id: 'label-1' };
      const label2 = { ...mockEdgeLabel, id: 'label-2' };
      const label3 = { ...mockEdgeLabel, id: 'label-3' };

      initUpdater.addEdgeLabel('edge-1', label1);
      initUpdater.addEdgeLabel('edge-1', label2);
      initUpdater.addEdgeLabel('edge-1', label3);

      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith(`edge-1->label-1`, label1);
      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith(`edge-1->label-2`, label2);
      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith(`edge-1->label-3`, label3);
      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('applyEdgeLabelSize', () => {
    it('should schedule edge label size initialization with compound id', () => {
      const size = { width: 100, height: 100 };

      initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      expect(BatchInitializer.prototype.batchChange).toHaveBeenCalledWith('edge-1->label-1', size);
    });
  });
});
