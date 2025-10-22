import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { FlowCore } from '../../flow-core';
import type { Edge, EdgeLabel, Node, Port, Size } from '../../types';
import { InitUpdater, MEASUREMENT_TIMEOUT, STABILITY_DELAY } from './init-updater';

describe('InitUpdater', () => {
  let initUpdater: InitUpdater;
  let mockFlowCore: {
    getState: Mock;
    setState: Mock;
    internalUpdater: {
      addPort: Mock;
      addEdgeLabel: Mock;
      applyNodeSize: Mock;
      applyPortsSizesAndPositions: Mock;
      applyEdgeLabelSize: Mock;
    };
  };

  const createMockNode = (id: string, withPorts = false): Node => ({
    id,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    type: 'default',
    data: {},
    measuredPorts: withPorts
      ? [
          {
            id: 'port1',
            type: 'source',
            nodeId: id,
            side: 'top',
            size: { width: 10, height: 10 },
            position: { x: 5, y: 0 },
          },
        ]
      : undefined,
  });

  const createMockEdge = (id: string, withLabels = false): Edge => ({
    id,
    source: 'node1',
    target: 'node2',
    type: 'default',
    data: {},
    measuredLabels: withLabels
      ? [
          {
            id: 'label1',
            positionOnEdge: 0.5,
            size: { width: 50, height: 20 },
          },
        ]
      : undefined,
  });

  const createMockPort = (id: string): Port => ({
    id,
    type: 'source',
    nodeId: 'node1',
    side: 'top',
    size: { width: 10, height: 10 },
    position: { x: 0, y: 0 },
  });

  const createMockEdgeLabel = (id: string): EdgeLabel => ({
    id,
    positionOnEdge: 0.5,
  });

  beforeEach(() => {
    vi.useFakeTimers();

    mockFlowCore = {
      getState: vi.fn(),
      setState: vi.fn(),
      internalUpdater: {
        addPort: vi.fn(),
        addEdgeLabel: vi.fn(),
        applyNodeSize: vi.fn(),
        applyPortsSizesAndPositions: vi.fn(),
        applyEdgeLabelSize: vi.fn(),
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with isInitialized=false when no nodes or edges', () => {
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [] });

      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      expect(initUpdater.isInitialized).toBe(false);
    });

    it('should initialize with isInitialized=false when nodes exist', () => {
      mockFlowCore.getState.mockReturnValue({
        nodes: [createMockNode('node1')],
        edges: [],
      });

      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      expect(initUpdater.isInitialized).toBe(false);
    });

    it('should initialize with isInitialized=false when edges exist', () => {
      mockFlowCore.getState.mockReturnValue({
        nodes: [],
        edges: [createMockEdge('edge1')],
      });

      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      expect(initUpdater.isInitialized).toBe(false);
    });
  });

  describe('start', () => {
    it('should mark as initialized immediately with no entities', async () => {
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      // Should resolve immediately without waiting for stability delay
      await vi.runAllTimersAsync();

      expect(initUpdater.isInitialized).toBe(true);
    });

    it('should call onComplete callback after initialization', async () => {
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      const onComplete = vi.fn();
      initUpdater.start(onComplete);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should wait for node measurements before finishing', async () => {
      const node = { ...createMockNode('node1'), size: undefined };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      // Advance only stability delay, not the measurement timeout
      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(false);

      initUpdater.applyNodeSize('node1', { width: 100, height: 100 });

      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(true);
    });

    it('should wait for port measurements before finishing', async () => {
      const node = {
        ...createMockNode('node1'),
        size: { width: 100, height: 100 },
        measuredPorts: [
          {
            id: 'port1',
            type: 'source' as const,
            nodeId: 'node1',
            side: 'top' as const,
            size: undefined,
            position: undefined,
          },
        ],
      };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      // Advance only stability delay, not the measurement timeout
      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(false);

      initUpdater.applyPortsSizesAndPositions('node1', [
        { id: 'port1', size: { width: 10, height: 10 }, position: { x: 5, y: 0 } },
      ]);

      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(true);
    });

    it('should wait for edge label measurements before finishing', async () => {
      const edge = {
        ...createMockEdge('edge1'),
        measuredLabels: [
          {
            id: 'label1',
            positionOnEdge: 0.5,
            size: undefined,
          },
        ],
      };
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [edge] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      // Advance only stability delay, not the measurement timeout
      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(false);

      initUpdater.applyEdgeLabelSize('edge1', 'label1', { width: 50, height: 20 });

      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(true);
    });

    it('should handle async onComplete callback', async () => {
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      const onComplete = vi.fn().mockResolvedValue(undefined);
      initUpdater.start(onComplete);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(initUpdater.isInitialized).toBe(true);
    });
  });

  describe('applyNodeSize', () => {
    it('should record node size measurement and apply on finish', async () => {
      const node = { ...createMockNode('node1'), size: undefined };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      const size = { width: 150, height: 150 };
      initUpdater.applyNodeSize('node1', size);

      await Promise.resolve();

      expect(mockFlowCore.setState).toHaveBeenCalledTimes(1);
      const stateUpdate = mockFlowCore.setState.mock.calls[0][0];
      expect(stateUpdate.nodes[0].size).toEqual(size);
    });

    it('should queue measurement if finishing', async () => {
      const node = { ...createMockNode('node1'), size: undefined };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      const onComplete = vi.fn(() => {
        // Apply node size while finish() is executing
        initUpdater.applyNodeSize('node2', { width: 200, height: 200 });
      });

      initUpdater.start(onComplete);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      // Trigger finish by applying node1 size
      initUpdater.applyNodeSize('node1', { width: 100, height: 100 });

      await vi.runAllTimersAsync();

      expect(initUpdater.isInitialized).toBe(true);
      expect(mockFlowCore.internalUpdater.applyNodeSize).toHaveBeenCalledWith('node2', {
        width: 200,
        height: 200,
      });
    });
  });

  describe('addPort', () => {
    beforeEach(() => {
      const node = createMockNode('node1');
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);
    });

    it('should add port and delay stabilization', async () => {
      initUpdater.start();

      const port = createMockPort('port1');
      initUpdater.addPort('node1', port);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      // Should not finish yet - waiting for port measurement
      expect(initUpdater.isInitialized).toBe(false);
    });

    it('should reset stability timer on multiple port additions', async () => {
      initUpdater.start();

      initUpdater.addPort('node1', createMockPort('port1'));

      vi.advanceTimersByTime(30);

      initUpdater.addPort('node1', createMockPort('port2'));

      vi.advanceTimersByTime(30);

      // Should not be stabilized yet (only 30ms since last addition)
      expect(initUpdater.isInitialized).toBe(false);

      vi.advanceTimersByTime(20);
      await Promise.resolve();

      // Should still not finish - waiting for measurements
      expect(initUpdater.isInitialized).toBe(false);
    });
  });

  describe('applyPortsSizesAndPositions', () => {
    it('should record port measurements', async () => {
      const node = {
        ...createMockNode('node1'),
        size: { width: 100, height: 100 },
        measuredPorts: [
          {
            id: 'port1',
            type: 'source' as const,
            nodeId: 'node1',
            side: 'top' as const,
            size: undefined,
            position: undefined,
          },
        ],
      };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      initUpdater.applyPortsSizesAndPositions('node1', [
        { id: 'port1', size: { width: 10, height: 10 }, position: { x: 5, y: 0 } },
      ]);

      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(true);
    });

    it('should skip ports without size or position', async () => {
      const node = {
        ...createMockNode('node1'),
        size: { width: 100, height: 100 },
        measuredPorts: [
          {
            id: 'port1',
            type: 'source' as const,
            nodeId: 'node1',
            side: 'top' as const,
            size: undefined,
            position: undefined,
          },
        ],
      };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      initUpdater.applyPortsSizesAndPositions('node1', [
        { id: 'port1', size: undefined as unknown as Size, position: { x: 5, y: 0 } },
      ]);

      await Promise.resolve();

      // Should not finish - port wasn't measured
      expect(initUpdater.isInitialized).toBe(false);
    });
  });

  describe('addEdgeLabel', () => {
    beforeEach(() => {
      const edge = createMockEdge('edge1');
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [edge] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);
    });

    it('should add label and delay stabilization', async () => {
      initUpdater.start();

      const label = createMockEdgeLabel('label1');
      initUpdater.addEdgeLabel('edge1', label);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      // Should not finish yet - waiting for label measurement
      expect(initUpdater.isInitialized).toBe(false);
    });

    it('should reset stability timer on multiple label additions', async () => {
      initUpdater.start();

      initUpdater.addEdgeLabel('edge1', createMockEdgeLabel('label1'));

      vi.advanceTimersByTime(30);

      initUpdater.addEdgeLabel('edge1', createMockEdgeLabel('label2'));

      vi.advanceTimersByTime(30);

      // Should not be stabilized yet (only 30ms since last addition)
      expect(initUpdater.isInitialized).toBe(false);

      vi.advanceTimersByTime(20);
      await Promise.resolve();

      // Should still not finish - waiting for measurements
      expect(initUpdater.isInitialized).toBe(false);
    });
  });

  describe('applyEdgeLabelSize', () => {
    beforeEach(() => {
      const edge = createMockEdge('edge1', true);
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [edge] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);
    });

    it('should record label size measurement', async () => {
      initUpdater.start();

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      initUpdater.applyEdgeLabelSize('edge1', 'label1', { width: 50, height: 20 });

      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(true);
    });
  });

  describe('late arrival queueing', () => {
    it('should queue port additions that arrive during finish', async () => {
      const node = { ...createMockNode('node1'), size: undefined };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      let finishCallbackExecuted = false;
      const onComplete = vi.fn(() => {
        // Add port while finish() is executing
        initUpdater.addPort('node1', createMockPort('port1'));
        finishCallbackExecuted = true;
      });

      initUpdater.start(onComplete);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      // Apply node size to trigger finish
      initUpdater.applyNodeSize('node1', { width: 100, height: 100 });

      await vi.runAllTimersAsync();

      expect(finishCallbackExecuted).toBe(true);
      expect(initUpdater.isInitialized).toBe(true);
      expect(mockFlowCore.internalUpdater.addPort).toHaveBeenCalledWith('node1', expect.any(Object));
    });

    it('should queue measurements that arrive during finish', async () => {
      const node = { ...createMockNode('node1'), size: undefined };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      let finishCallbackExecuted = false;
      const onComplete = vi.fn(() => {
        // Add measurement while finish() is executing
        initUpdater.applyNodeSize('node2', { width: 200, height: 200 });
        finishCallbackExecuted = true;
      });

      initUpdater.start(onComplete);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      // Apply node size to trigger finish
      initUpdater.applyNodeSize('node1', { width: 100, height: 100 });

      await vi.runAllTimersAsync();

      expect(finishCallbackExecuted).toBe(true);
      expect(initUpdater.isInitialized).toBe(true);
      expect(mockFlowCore.internalUpdater.applyNodeSize).toHaveBeenCalledWith('node2', {
        width: 200,
        height: 200,
      });
    });

    it('should queue edge label additions that arrive during finish', async () => {
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      let finishCallbackExecuted = false;
      const onComplete = vi.fn(() => {
        // Add label while finish() is executing
        initUpdater.addEdgeLabel('edge1', createMockEdgeLabel('label1'));
        finishCallbackExecuted = true;
      });

      initUpdater.start(onComplete);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      expect(finishCallbackExecuted).toBe(true);
      expect(initUpdater.isInitialized).toBe(true);
      expect(mockFlowCore.internalUpdater.addEdgeLabel).toHaveBeenCalledWith('edge1', expect.any(Object));
    });
  });

  describe('state application', () => {
    it('should apply all collected data on finish', async () => {
      const node = createMockNode('node1');
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();
      initUpdater.applyNodeSize('node1', { width: 150, height: 150 });

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      expect(mockFlowCore.setState).toHaveBeenCalledTimes(1);
      const stateUpdate = mockFlowCore.setState.mock.calls[0][0];
      expect(stateUpdate.nodes[0].size).toEqual({ width: 150, height: 150 });
    });

    it('should merge new ports with existing ports', async () => {
      const node = createMockNode('node1', true);
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      const newPort = createMockPort('port2');
      initUpdater.addPort('node1', newPort);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      initUpdater.applyNodeSize('node1', { width: 100, height: 100 });
      initUpdater.applyPortsSizesAndPositions('node1', [
        { id: 'port1', size: { width: 10, height: 10 }, position: { x: 5, y: 0 } },
        { id: 'port2', size: { width: 15, height: 15 }, position: { x: 10, y: 0 } },
      ]);

      expect(mockFlowCore.setState).toHaveBeenCalledTimes(1);
      const stateUpdate = mockFlowCore.setState.mock.calls[0][0];
      expect(stateUpdate.nodes[0].measuredPorts).toHaveLength(2);
    });

    it('should merge new labels with existing labels', async () => {
      const edge = createMockEdge('edge1', true);
      mockFlowCore.getState.mockReturnValue({ nodes: [], edges: [edge] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      const newLabel = createMockEdgeLabel('label2');
      initUpdater.addEdgeLabel('edge1', newLabel);

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      initUpdater.applyEdgeLabelSize('edge1', 'label1', { width: 50, height: 20 });
      initUpdater.applyEdgeLabelSize('edge1', 'label2', { width: 60, height: 25 });

      expect(mockFlowCore.setState).toHaveBeenCalledTimes(1);
      const stateUpdate = mockFlowCore.setState.mock.calls[0][0];
      expect(stateUpdate.edges[0].measuredLabels).toHaveLength(2);
    });
  });

  describe('safety timeout', () => {
    it('should force finish after measurement timeout when measurements never arrive', async () => {
      const node = { ...createMockNode('node1'), size: undefined };
      mockFlowCore.getState.mockReturnValue({ nodes: [node], edges: [] });
      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      initUpdater.start();

      // Advance stability delay
      vi.advanceTimersByTime(STABILITY_DELAY);
      await Promise.resolve();

      expect(initUpdater.isInitialized).toBe(false);

      // Advance to measurement timeout
      vi.advanceTimersByTime(MEASUREMENT_TIMEOUT);
      await vi.runAllTimersAsync();

      // Should force finish even without measurements
      expect(initUpdater.isInitialized).toBe(true);
      expect(mockFlowCore.setState).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration', () => {
    it('should handle complex initialization scenario', async () => {
      const node1 = { ...createMockNode('node1'), size: undefined };
      const node2 = {
        ...createMockNode('node2'),
        size: undefined,
        measuredPorts: [
          {
            id: 'port1',
            type: 'source' as const,
            nodeId: 'node2',
            side: 'top' as const,
            size: undefined,
            position: undefined,
          },
        ],
      };
      const edge1 = createMockEdge('edge1');
      mockFlowCore.getState.mockReturnValue({
        nodes: [node1, node2],
        edges: [edge1],
      });

      initUpdater = new InitUpdater(mockFlowCore as unknown as FlowCore);

      const onComplete = vi.fn();
      initUpdater.start(onComplete);

      // Add new entities
      initUpdater.addPort('node1', createMockPort('port1'));
      initUpdater.addEdgeLabel('edge1', createMockEdgeLabel('label1'));

      vi.advanceTimersByTime(STABILITY_DELAY);
      await vi.runAllTimersAsync();

      // Apply measurements
      initUpdater.applyNodeSize('node1', { width: 100, height: 100 });
      initUpdater.applyNodeSize('node2', { width: 150, height: 150 });
      initUpdater.applyPortsSizesAndPositions('node1', [
        { id: 'port1', size: { width: 10, height: 10 }, position: { x: 5, y: 0 } },
      ]);
      initUpdater.applyPortsSizesAndPositions('node2', [
        { id: 'port1', size: { width: 10, height: 10 }, position: { x: 5, y: 0 } },
      ]);
      initUpdater.applyEdgeLabelSize('edge1', 'label1', { width: 50, height: 20 });

      await vi.runAllTimersAsync();

      expect(initUpdater.isInitialized).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(mockFlowCore.setState).toHaveBeenCalledTimes(1);
    });
  });
});
