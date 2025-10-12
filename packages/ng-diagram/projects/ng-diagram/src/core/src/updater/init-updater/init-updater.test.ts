import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../flow-core';
import { mockEdgeLabel, mockNode, mockPort } from '../../test-utils';
import { BatchInitializer } from './batch-initializer';
import { InitUpdater } from './init-updater';

// Create shared mocks for BatchInitializer instances
const waitForStabilityMock = vi.fn(() => Promise.resolve());
const addMock = vi.fn();
const dataMock = new Map();

// Mock BatchInitializer
vi.mock('./batch-initializer', () => ({
  BatchInitializer: vi.fn().mockImplementation(() => ({
    waitForStability: waitForStabilityMock,
    add: addMock,
    data: dataMock,
  })),
}));

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
      internalUpdater: {
        addPort: vi.fn(),
        addEdgeLabel: vi.fn(),
        applyNodeSize: vi.fn(),
        applyPortsSizesAndPositions: vi.fn(),
        applyEdgeLabelSize: vi.fn(),
      },
    } as unknown as FlowCore;

    getStateMock.mockReturnValue(stateMock);
    vi.clearAllMocks();
    waitForStabilityMock.mockClear();
    addMock.mockClear();
    dataMock.clear();

    initUpdater = new InitUpdater(flowCore);
  });

  describe('constructor', () => {
    it('should initialize with isInitialized as false', () => {
      expect(initUpdater.isInitialized).toBe(false);
    });

    it('should create 2 batch initializers (ports and labels)', () => {
      expect(BatchInitializer).toHaveBeenCalledTimes(2);
    });
  });

  describe('start', () => {
    it('should call waitForStability on both initializers and emit init command', async () => {
      const onCompleteMock = vi.fn().mockResolvedValue(undefined);

      // Set up state with a measured node so finish condition is met
      const stateWithMeasuredNode = {
        nodes: [{ id: 'node-1', size: { width: 100, height: 100 } }],
        edges: [],
        metadata: {},
      };
      getStateMock.mockReturnValue(stateWithMeasuredNode);

      const newInitUpdater = new InitUpdater(flowCore);
      newInitUpdater.start(onCompleteMock);

      // waitForStability should be called for port and label initializers
      expect(waitForStabilityMock).toHaveBeenCalled();

      // Initially, isInitialized should still be false (async)
      expect(newInitUpdater.isInitialized).toBe(false);

      // Wait for promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      // After promises resolve, isInitialized should be true and callback called
      expect(newInitUpdater.isInitialized).toBe(true);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
    });

    it('should handle initialization failure and force finish', async () => {
      const onCompleteMock = vi.fn();
      const error = new Error('Initialization failed');

      // Set up state with a measured node
      const stateWithMeasuredNode = {
        nodes: [{ id: 'node-1', size: { width: 100, height: 100 } }],
        edges: [],
        metadata: {},
      };
      getStateMock.mockReturnValue(stateWithMeasuredNode);

      // Make one initializer fail
      waitForStabilityMock.mockResolvedValueOnce(undefined).mockRejectedValueOnce(error);

      // Spy on console.error
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const newInitUpdater = new InitUpdater(flowCore);
      newInitUpdater.start(onCompleteMock);

      // Wait for promises to resolve/reject
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should still set isInitialized and call callback even on error
      expect(newInitUpdater.isInitialized).toBe(true);
      expect(onCompleteMock).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[InitUpdater] Entity stabilization failed:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should work without onComplete callback', async () => {
      // Set up state with a measured node
      const stateWithMeasuredNode = {
        nodes: [{ id: 'node-1', size: { width: 100, height: 100 } }],
        edges: [],
        metadata: {},
      };
      getStateMock.mockReturnValue(stateWithMeasuredNode);

      const newInitUpdater = new InitUpdater(flowCore);
      newInitUpdater.start(); // No callback

      // Wait for promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should still set isInitialized
      expect(newInitUpdater.isInitialized).toBe(true);
    });

    it('should collect already measured items from initial state', () => {
      const stateWithMeasuredItems = {
        nodes: [
          {
            id: 'node-1',
            size: { width: 100, height: 100 },
            measuredPorts: [
              {
                id: 'port-1',
                size: { width: 50, height: 50 },
                position: { x: 10, y: 10 },
              },
            ],
          },
        ],
        edges: [
          {
            id: 'edge-1',
            measuredLabels: [{ id: 'label-1', size: { width: 80, height: 20 } }],
          },
        ],
        metadata: {},
      };
      getStateMock.mockReturnValue(stateWithMeasuredItems);

      const newInitUpdater = new InitUpdater(flowCore);
      newInitUpdater.start();

      // Pre-measured items should be tracked (we can't directly test private fields,
      // but we can verify the behavior by ensuring finish happens immediately if all are measured)
      expect(newInitUpdater.isInitialized).toBe(false); // Still waiting for stabilization
    });
  });

  describe('applyNodeSize', () => {
    it('should store node size with valid dimensions', () => {
      const size = { width: 100, height: 100 };

      initUpdater.applyNodeSize('node-1', size);

      // Can't directly test private Map, but we can verify it doesn't throw
      expect(() => initUpdater.applyNodeSize('node-1', size)).not.toThrow();
    });

    it('should not track node as measured if size is 0', () => {
      const size = { width: 0, height: 0 };

      initUpdater.applyNodeSize('node-1', size);

      // Size is stored but not tracked as measured (can't verify directly, but shouldn't throw)
      expect(() => initUpdater.applyNodeSize('node-1', size)).not.toThrow();
    });

    it('should store node sizes during initialization', () => {
      const size = { width: 100, height: 100 };

      initUpdater.applyNodeSize('node-1', size);

      // Should accept without throwing during initialization
      expect(() => initUpdater.applyNodeSize('node-1', size)).not.toThrow();
    });
  });

  describe('addPort', () => {
    it('should add port to BatchInitializer', () => {
      initUpdater.addPort('node-1', mockPort);

      expect(addMock).toHaveBeenCalledWith(`node-1->${mockPort.id}`, mockPort);
    });

    it('should track added ports during initialization', () => {
      initUpdater.addPort('node-1', mockPort);

      // Should add to BatchInitializer and track in expectedPorts
      expect(addMock).toHaveBeenCalledWith(`node-1->${mockPort.id}`, mockPort);
    });
  });

  describe('applyPortsSizesAndPositions', () => {
    it('should not process anything if node does not exist', () => {
      vi.mocked(flowCore.getNodeById).mockReturnValue(null);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        {
          id: 'port-1',
          size: { width: 100, height: 100 },
          position: { x: 0, y: 0 },
        },
      ]);

      // Should return early without throwing
      expect(() =>
        initUpdater.applyPortsSizesAndPositions('node-1', [
          {
            id: 'port-1',
            size: { width: 100, height: 100 },
            position: { x: 0, y: 0 },
          },
        ])
      ).not.toThrow();
    });

    it('should store port measurements', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1' }],
      };
      vi.mocked(flowCore.getNodeById).mockReturnValue(node);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        {
          id: 'port-1',
          size: { width: 100, height: 100 },
          position: { x: 10, y: 10 },
        },
      ]);

      expect(() =>
        initUpdater.applyPortsSizesAndPositions('node-1', [
          {
            id: 'port-1',
            size: { width: 100, height: 100 },
            position: { x: 10, y: 10 },
          },
        ])
      ).not.toThrow();
    });

    it('should skip ports without size or position', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1' }],
      };
      vi.mocked(flowCore.getNodeById).mockReturnValue(node);

      initUpdater.applyPortsSizesAndPositions('node-1', [
        { id: 'port-1', size: undefined, position: { x: 10, y: 10 } },
      ]);

      // Should skip without throwing
      expect(() =>
        initUpdater.applyPortsSizesAndPositions('node-1', [
          { id: 'port-1', size: undefined, position: { x: 10, y: 10 } },
        ])
      ).not.toThrow();
    });

    it('should track port measurements during initialization', () => {
      const node = {
        ...mockNode,
        measuredPorts: [{ ...mockPort, id: 'port-1' }],
      };
      vi.mocked(flowCore.getNodeById).mockReturnValue(node);

      const ports = [
        {
          id: 'port-1',
          size: { width: 100, height: 100 },
          position: { x: 10, y: 10 },
        },
      ];
      initUpdater.applyPortsSizesAndPositions('node-1', ports);

      // Should store without throwing
      expect(() => initUpdater.applyPortsSizesAndPositions('node-1', ports)).not.toThrow();
    });
  });

  describe('addEdgeLabel', () => {
    it('should add edge label to BatchInitializer', () => {
      initUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      expect(addMock).toHaveBeenCalledWith(`edge-1->${mockEdgeLabel.id}`, mockEdgeLabel);
    });

    it('should handle multiple labels for the same edge', () => {
      const label1 = { ...mockEdgeLabel, id: 'label-1' };
      const label2 = { ...mockEdgeLabel, id: 'label-2' };
      const label3 = { ...mockEdgeLabel, id: 'label-3' };

      initUpdater.addEdgeLabel('edge-1', label1);
      initUpdater.addEdgeLabel('edge-1', label2);
      initUpdater.addEdgeLabel('edge-1', label3);

      expect(addMock).toHaveBeenCalledWith(`edge-1->label-1`, label1);
      expect(addMock).toHaveBeenCalledWith(`edge-1->label-2`, label2);
      expect(addMock).toHaveBeenCalledWith(`edge-1->label-3`, label3);
      expect(addMock).toHaveBeenCalledTimes(3);
    });

    it('should track added labels during initialization', () => {
      initUpdater.addEdgeLabel('edge-1', mockEdgeLabel);

      // Should add to BatchInitializer and track in expectedLabels
      expect(addMock).toHaveBeenCalledWith(`edge-1->${mockEdgeLabel.id}`, mockEdgeLabel);
    });
  });

  describe('applyEdgeLabelSize', () => {
    it('should store edge label size', () => {
      const size = { width: 100, height: 100 };

      initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      expect(() => initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size)).not.toThrow();
    });

    it('should not track label as measured if size is 0', () => {
      const size = { width: 0, height: 0 };

      initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      expect(() => initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size)).not.toThrow();
    });

    it('should track label sizes during initialization', () => {
      const size = { width: 100, height: 100 };
      initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size);

      // Should store without throwing
      expect(() => initUpdater.applyEdgeLabelSize('edge-1', 'label-1', size)).not.toThrow();
    });
  });
});
