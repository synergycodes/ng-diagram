import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { LateArrivalQueue } from './late-arrival-queue';
import type { Updater } from '../updater.interface';
import type { Port, EdgeLabel } from '../../types';

describe('LateArrivalQueue', () => {
  let queue: LateArrivalQueue;
  let mockUpdater: {
    addPort: Mock;
    addEdgeLabel: Mock;
    applyNodeSize: Mock;
    applyPortChanges: Mock;
    applyEdgeLabelChanges: Mock;
    deleteEdgeLabel: Mock;
  } & Updater;

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
    queue = new LateArrivalQueue();
    mockUpdater = {
      addPort: vi.fn(),
      addEdgeLabel: vi.fn(),
      applyNodeSize: vi.fn(),
      applyPortChanges: vi.fn(),
      applyEdgeLabelChanges: vi.fn(),
      deleteEdgeLabel: vi.fn(),
    } as typeof mockUpdater;
  });

  describe('initial state', () => {
    it('should start with isFinishing=false', () => {
      expect(queue.isFinishing).toBe(false);
    });

    it('should start with length=0', () => {
      expect(queue.length).toBe(0);
    });
  });

  describe('startFinishing', () => {
    it('should set isFinishing to true', () => {
      queue.startFinishing();

      expect(queue.isFinishing).toBe(true);
    });
  });

  describe('enqueue', () => {
    it('should add an item to the queue', () => {
      queue.enqueue({
        method: 'addPort',
        args: ['node1', createMockPort('port1')],
      });

      expect(queue.length).toBe(1);
    });

    it('should add multiple items to the queue', () => {
      queue.enqueue({
        method: 'addPort',
        args: ['node1', createMockPort('port1')],
      });
      queue.enqueue({
        method: 'addEdgeLabel',
        args: ['edge1', createMockEdgeLabel('label1')],
      });
      queue.enqueue({
        method: 'applyNodeSize',
        args: ['node1', { width: 100, height: 100 }],
      });

      expect(queue.length).toBe(3);
    });
  });

  describe('processAll', () => {
    it('should do nothing when queue is empty', () => {
      queue.processAll(mockUpdater);

      expect(mockUpdater.addPort).not.toHaveBeenCalled();
      expect(mockUpdater.addEdgeLabel).not.toHaveBeenCalled();
      expect(mockUpdater.applyNodeSize).not.toHaveBeenCalled();
      expect(mockUpdater.applyPortChanges).not.toHaveBeenCalled();
      expect(mockUpdater.applyEdgeLabelChanges).not.toHaveBeenCalled();
    });

    it('should process addPort arrival', () => {
      const port = createMockPort('port1');
      queue.enqueue({ method: 'addPort', args: ['node1', port] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.addPort).toHaveBeenCalledWith('node1', port);
      expect(mockUpdater.addPort).toHaveBeenCalledTimes(1);
    });

    it('should process addEdgeLabel arrival', () => {
      const label = createMockEdgeLabel('label1');
      queue.enqueue({ method: 'addEdgeLabel', args: ['edge1', label] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.addEdgeLabel).toHaveBeenCalledWith('edge1', label);
      expect(mockUpdater.addEdgeLabel).toHaveBeenCalledTimes(1);
    });

    it('should process applyNodeSize arrival', () => {
      const size = { width: 100, height: 100 };
      queue.enqueue({ method: 'applyNodeSize', args: ['node1', size] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.applyNodeSize).toHaveBeenCalledWith('node1', size);
      expect(mockUpdater.applyNodeSize).toHaveBeenCalledTimes(1);
    });

    it('should process applyPortChanges arrival', () => {
      const portUpdates = [
        { portId: 'port1', portChanges: { size: { width: 10, height: 10 }, position: { x: 0, y: 0 } } },
        { portId: 'port2', portChanges: { size: { width: 20, height: 20 }, position: { x: 10, y: 10 } } },
      ];
      queue.enqueue({ method: 'applyPortChanges', args: ['node1', portUpdates] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.applyPortChanges).toHaveBeenCalledWith('node1', portUpdates);
      expect(mockUpdater.applyPortChanges).toHaveBeenCalledTimes(1);
    });

    it('should process applyEdgeLabelChanges arrival', () => {
      const labelUpdates = [{ labelId: 'label1', labelChanges: { size: { width: 50, height: 20 } } }];
      queue.enqueue({ method: 'applyEdgeLabelChanges', args: ['edge1', labelUpdates] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.applyEdgeLabelChanges).toHaveBeenCalledWith('edge1', labelUpdates);
      expect(mockUpdater.applyEdgeLabelChanges).toHaveBeenCalledTimes(1);
    });

    it('should process applyPortChanges arrival with side/type changes', () => {
      const portUpdates = [
        { portId: 'port1', portChanges: { side: 'left' as const } },
        { portId: 'port2', portChanges: { type: 'target' as const } },
      ];
      queue.enqueue({ method: 'applyPortChanges', args: ['node1', portUpdates] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.applyPortChanges).toHaveBeenCalledWith('node1', portUpdates);
      expect(mockUpdater.applyPortChanges).toHaveBeenCalledTimes(1);
    });

    it('should process applyEdgeLabelChanges arrival with positionOnEdge changes', () => {
      const labelUpdates = [{ labelId: 'label1', labelChanges: { positionOnEdge: 0.75 } }];
      queue.enqueue({ method: 'applyEdgeLabelChanges', args: ['edge1', labelUpdates] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.applyEdgeLabelChanges).toHaveBeenCalledWith('edge1', labelUpdates);
      expect(mockUpdater.applyEdgeLabelChanges).toHaveBeenCalledTimes(1);
    });

    it('should process deleteEdgeLabel arrival', () => {
      queue.enqueue({ method: 'deleteEdgeLabel', args: ['edge1', 'label1'] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.deleteEdgeLabel).toHaveBeenCalledWith('edge1', 'label1');
      expect(mockUpdater.deleteEdgeLabel).toHaveBeenCalledTimes(1);
    });

    it('should process multiple arrivals in order', () => {
      const port = createMockPort('port1');
      const label = createMockEdgeLabel('label1');
      const size = { width: 100, height: 100 };

      queue.enqueue({ method: 'addPort', args: ['node1', port] });
      queue.enqueue({ method: 'addEdgeLabel', args: ['edge1', label] });
      queue.enqueue({ method: 'applyNodeSize', args: ['node1', size] });

      queue.processAll(mockUpdater);

      expect(mockUpdater.addPort).toHaveBeenCalledWith('node1', port);
      expect(mockUpdater.addEdgeLabel).toHaveBeenCalledWith('edge1', label);
      expect(mockUpdater.applyNodeSize).toHaveBeenCalledWith('node1', size);

      // Verify order of execution
      const addPortOrder = mockUpdater.addPort.mock.invocationCallOrder[0];
      const addEdgeLabelOrder = mockUpdater.addEdgeLabel.mock.invocationCallOrder[0];
      const applyNodeSizeOrder = mockUpdater.applyNodeSize.mock.invocationCallOrder[0];

      expect(addPortOrder).toBeLessThan(addEdgeLabelOrder);
      expect(addEdgeLabelOrder).toBeLessThan(applyNodeSizeOrder);
    });

    it('should clear the queue after processing', () => {
      queue.enqueue({
        method: 'addPort',
        args: ['node1', createMockPort('port1')],
      });
      queue.enqueue({
        method: 'addEdgeLabel',
        args: ['edge1', createMockEdgeLabel('label1')],
      });

      expect(queue.length).toBe(2);

      queue.processAll(mockUpdater);

      expect(queue.length).toBe(0);
    });

    it('should allow multiple processAll calls', () => {
      const port1 = createMockPort('port1');
      const port2 = createMockPort('port2');

      queue.enqueue({ method: 'addPort', args: ['node1', port1] });
      queue.processAll(mockUpdater);

      expect(mockUpdater.addPort).toHaveBeenCalledTimes(1);
      expect(queue.length).toBe(0);

      queue.enqueue({ method: 'addPort', args: ['node2', port2] });
      queue.processAll(mockUpdater);

      expect(mockUpdater.addPort).toHaveBeenCalledTimes(2);
      expect(mockUpdater.addPort).toHaveBeenNthCalledWith(1, 'node1', port1);
      expect(mockUpdater.addPort).toHaveBeenNthCalledWith(2, 'node2', port2);
      expect(queue.length).toBe(0);
    });
  });

  describe('typical workflow', () => {
    it('should handle startFinishing -> enqueue -> processAll', () => {
      const port = createMockPort('port1');

      queue.startFinishing();
      expect(queue.isFinishing).toBe(true);

      queue.enqueue({ method: 'addPort', args: ['node1', port] });
      expect(queue.length).toBe(1);

      queue.processAll(mockUpdater);
      expect(mockUpdater.addPort).toHaveBeenCalledWith('node1', port);
      expect(queue.length).toBe(0);
    });

    it('should queue multiple arrivals during finishing', () => {
      queue.startFinishing();

      queue.enqueue({
        method: 'addPort',
        args: ['node1', createMockPort('port1')],
      });
      queue.enqueue({
        method: 'addEdgeLabel',
        args: ['edge1', createMockEdgeLabel('label1')],
      });
      queue.enqueue({
        method: 'applyNodeSize',
        args: ['node1', { width: 100, height: 100 }],
      });

      expect(queue.length).toBe(3);
      expect(queue.isFinishing).toBe(true);

      queue.processAll(mockUpdater);

      expect(mockUpdater.addPort).toHaveBeenCalledTimes(1);
      expect(mockUpdater.addEdgeLabel).toHaveBeenCalledTimes(1);
      expect(mockUpdater.applyNodeSize).toHaveBeenCalledTimes(1);
      expect(queue.length).toBe(0);
    });
  });
});
