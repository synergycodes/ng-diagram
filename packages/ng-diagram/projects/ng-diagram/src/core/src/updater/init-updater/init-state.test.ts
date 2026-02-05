import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import type { FlowCore } from '../../flow-core';
import type { Edge, EdgeLabel, Node, Point, Port, Size } from '../../types';
import { InitState } from './init-state';

describe('InitState', () => {
  let initState: InitState;

  const createValidSize = (): Size => ({ width: 100, height: 50 });
  const createInvalidSize = (): Size => ({ width: 0, height: 0 });
  const createValidPosition = (): Point => ({ x: 10, y: 20 });

  const createMockPort = (id: string, nodeId: string): Port => ({
    id,
    type: 'source',
    nodeId,
    side: 'top',
    size: createValidSize(),
    position: createValidPosition(),
  });

  const createMockEdgeLabel = (id: string): EdgeLabel => ({
    id,
    positionOnEdge: 0.5,
    size: createValidSize(),
  });

  const createMockNode = (id: string, withValidSize = true): Node => ({
    id,
    position: { x: 0, y: 0 },
    size: withValidSize ? createValidSize() : createInvalidSize(),
    type: 'default',
    data: {},
  });

  const createMockEdge = (id: string): Edge => ({
    id,
    source: 'node1',
    target: 'node2',
    type: 'default',
    data: {},
  });

  beforeEach(() => {
    initState = new InitState();
  });

  describe('trackNodeMeasurement', () => {
    it('should store node size', () => {
      const size = createValidSize();
      initState.trackNodeMeasurement('node1', size);

      expect(initState.nodeSizes.get('node1')).toEqual(size);
    });

    it('should mark node as measured when size is valid', () => {
      const size = createValidSize();
      initState.trackNodeMeasurement('node1', size);

      expect(initState.measuredNodes.has('node1')).toBe(true);
    });

    it('should not mark node as measured when size is invalid', () => {
      const size = createInvalidSize();
      initState.trackNodeMeasurement('node1', size);

      expect(initState.measuredNodes.has('node1')).toBe(false);
    });
  });

  describe('trackPortMeasurement', () => {
    it('should store port size and position', () => {
      const size = createValidSize();
      const position = createValidPosition();

      initState.trackPortMeasurement('node1', 'port1', size, position);

      const key = 'node1->port1';
      expect(initState.portRects.get(key)).toEqual({ size, position });
    });

    it('should mark port as measured when size and position are valid', () => {
      const size = createValidSize();
      const position = createValidPosition();

      initState.trackPortMeasurement('node1', 'port1', size, position);

      const key = 'node1->port1';
      expect(initState.measuredPorts.has(key)).toBe(true);
    });

    it('should not mark port as measured when size is invalid', () => {
      const size = createInvalidSize();
      const position = createValidPosition();

      initState.trackPortMeasurement('node1', 'port1', size, position);

      const key = 'node1->port1';
      expect(initState.measuredPorts.has(key)).toBe(false);
    });

    it('should not mark port as measured when position is invalid', () => {
      const size = createValidSize();
      const position = undefined as unknown as Point;

      initState.trackPortMeasurement('node1', 'port1', size, position);

      const key = 'node1->port1';
      expect(initState.measuredPorts.has(key)).toBe(false);
    });
  });

  describe('trackLabelMeasurement', () => {
    it('should store label size', () => {
      const size = createValidSize();

      initState.trackLabelMeasurement('edge1', 'label1', size);

      const key = 'edge1->label1';
      expect(initState.edgeLabelSizes.get(key)).toEqual(size);
    });

    it('should mark label as measured when size is valid', () => {
      const size = createValidSize();

      initState.trackLabelMeasurement('edge1', 'label1', size);

      const key = 'edge1->label1';
      expect(initState.measuredLabels.has(key)).toBe(true);
    });

    it('should not mark label as measured when size is invalid', () => {
      const size = createInvalidSize();

      initState.trackLabelMeasurement('edge1', 'label1', size);

      const key = 'edge1->label1';
      expect(initState.measuredLabels.has(key)).toBe(false);
    });
  });

  describe('addPort', () => {
    it('should store port in initializedPorts', () => {
      const port = createMockPort('port1', 'node1');
      initState.addPort('node1', port);

      const key = 'node1->port1';
      expect(initState.initializedPorts.get(key)).toEqual(port);
    });

    it('should add port to portsToMeasure', () => {
      const port = createMockPort('port1', 'node1');
      initState.addPort('node1', port);

      const key = 'node1->port1';
      expect(initState.portsToMeasure.has(key)).toBe(true);
    });

    it('should handle multiple ports for same node', () => {
      initState.addPort('node1', createMockPort('port1', 'node1'));
      initState.addPort('node1', createMockPort('port2', 'node1'));

      expect(initState.portsToMeasure.has('node1->port1')).toBe(true);
      expect(initState.portsToMeasure.has('node1->port2')).toBe(true);
      expect(initState.portsToMeasure.size).toBe(2);
    });
  });

  describe('addLabel', () => {
    it('should store label in initializedLabels', () => {
      const label = createMockEdgeLabel('label1');
      initState.addLabel('edge1', label);

      const key = 'edge1->label1';
      expect(initState.initializedLabels.get(key)).toEqual(label);
    });

    it('should add label to labelsToMeasure', () => {
      const label = createMockEdgeLabel('label1');
      initState.addLabel('edge1', label);

      const key = 'edge1->label1';
      expect(initState.labelsToMeasure.has(key)).toBe(true);
    });

    it('should handle multiple labels for same edge', () => {
      initState.addLabel('edge1', createMockEdgeLabel('label1'));
      initState.addLabel('edge1', createMockEdgeLabel('label2'));

      expect(initState.labelsToMeasure.has('edge1->label1')).toBe(true);
      expect(initState.labelsToMeasure.has('edge1->label2')).toBe(true);
      expect(initState.labelsToMeasure.size).toBe(2);
    });
  });

  describe('collectAlreadyMeasuredItems', () => {
    it('should mark nodes with valid sizes as measured', () => {
      const nodes = [createMockNode('node1', true), createMockNode('node2', true)];
      const edges: Edge[] = [];

      initState.collectAlreadyMeasuredItems(nodes, edges);

      expect(initState.measuredNodes.has('node1')).toBe(true);
      expect(initState.measuredNodes.has('node2')).toBe(true);
      expect(initState.measuredNodes.size).toBe(2);
    });

    it('should not mark nodes with invalid sizes as measured', () => {
      const nodes = [createMockNode('node1', false)];
      const edges: Edge[] = [];

      initState.collectAlreadyMeasuredItems(nodes, edges);

      expect(initState.measuredNodes.has('node1')).toBe(false);
    });

    it('should track pre-existing ports', () => {
      const port = createMockPort('port1', 'node1');
      const node: Node = { ...createMockNode('node1', true), measuredPorts: [port] };

      initState.collectAlreadyMeasuredItems([node], []);

      const key = 'node1->port1';
      expect(initState.portsToMeasure.has(key)).toBe(true);
    });

    it('should mark ports with valid measurements as measured', () => {
      const port = createMockPort('port1', 'node1');
      const node: Node = { ...createMockNode('node1', true), measuredPorts: [port] };

      initState.collectAlreadyMeasuredItems([node], []);

      const key = 'node1->port1';
      expect(initState.measuredPorts.has(key)).toBe(true);
    });

    it('should not mark ports with invalid measurements as measured', () => {
      const port = createMockPort('port1', 'node1');
      port.size = createInvalidSize();
      const node: Node = { ...createMockNode('node1', true), measuredPorts: [port] };

      initState.collectAlreadyMeasuredItems([node], []);

      const key = 'node1->port1';
      expect(initState.measuredPorts.has(key)).toBe(false);
    });

    it('should track pre-existing labels', () => {
      const label = createMockEdgeLabel('label1');
      const edge: Edge = { ...createMockEdge('edge1'), measuredLabels: [label] };

      initState.collectAlreadyMeasuredItems([], [edge]);

      const key = 'edge1->label1';
      expect(initState.labelsToMeasure.has(key)).toBe(true);
    });

    it('should mark labels with valid measurements as measured', () => {
      const label = createMockEdgeLabel('label1');
      const edge: Edge = { ...createMockEdge('edge1'), measuredLabels: [label] };

      initState.collectAlreadyMeasuredItems([], [edge]);

      const key = 'edge1->label1';
      expect(initState.measuredLabels.has(key)).toBe(true);
    });

    it('should not mark labels with invalid measurements as measured', () => {
      const label = createMockEdgeLabel('label1');
      label.size = createInvalidSize();
      const edge: Edge = { ...createMockEdge('edge1'), measuredLabels: [label] };

      initState.collectAlreadyMeasuredItems([], [edge]);

      const key = 'edge1->label1';
      expect(initState.measuredLabels.has(key)).toBe(false);
    });
  });

  describe('allEntitiesHaveMeasurements', () => {
    it('should return true when all tracked nodes are measured', () => {
      // Track nodes via collectAlreadyMeasuredItems
      const node1 = createMockNode('node1', false);
      const node2 = createMockNode('node2', false);
      initState.collectAlreadyMeasuredItems([node1, node2], []);

      initState.trackNodeMeasurement('node1', createValidSize());
      initState.trackNodeMeasurement('node2', createValidSize());

      expect(initState.allEntitiesHaveMeasurements()).toBe(true);
    });

    it('should return false when not all tracked nodes are measured', () => {
      // Track 2 nodes but only measure 1
      const node1 = createMockNode('node1', false);
      const node2 = createMockNode('node2', false);
      initState.collectAlreadyMeasuredItems([node1, node2], []);

      initState.trackNodeMeasurement('node1', createValidSize());

      expect(initState.allEntitiesHaveMeasurements()).toBe(false);
    });

    it('should return true when all ports are measured', () => {
      initState.addPort('node1', createMockPort('port1', 'node1'));
      initState.trackPortMeasurement('node1', 'port1', createValidSize(), createValidPosition());

      expect(initState.allEntitiesHaveMeasurements()).toBe(true);
    });

    it('should return false when not all ports are measured', () => {
      initState.addPort('node1', createMockPort('port1', 'node1'));
      initState.addPort('node1', createMockPort('port2', 'node1'));
      initState.trackPortMeasurement('node1', 'port1', createValidSize(), createValidPosition());

      expect(initState.allEntitiesHaveMeasurements()).toBe(false);
    });

    it('should return true when all labels are measured', () => {
      initState.addLabel('edge1', createMockEdgeLabel('label1'));
      initState.trackLabelMeasurement('edge1', 'label1', createValidSize());

      expect(initState.allEntitiesHaveMeasurements()).toBe(true);
    });

    it('should return false when not all labels are measured', () => {
      initState.addLabel('edge1', createMockEdgeLabel('label1'));
      initState.addLabel('edge1', createMockEdgeLabel('label2'));
      initState.trackLabelMeasurement('edge1', 'label1', createValidSize());

      expect(initState.allEntitiesHaveMeasurements()).toBe(false);
    });

    it('should return true when all entities (nodes, ports, labels) are measured', () => {
      const node1 = createMockNode('node1', false);
      initState.collectAlreadyMeasuredItems([node1], []);

      initState.trackNodeMeasurement('node1', createValidSize());
      initState.addPort('node1', createMockPort('port1', 'node1'));
      initState.trackPortMeasurement('node1', 'port1', createValidSize(), createValidPosition());
      initState.addLabel('edge1', createMockEdgeLabel('label1'));
      initState.trackLabelMeasurement('edge1', 'label1', createValidSize());

      expect(initState.allEntitiesHaveMeasurements()).toBe(true);
    });

    it('should return false when any entity is not measured', () => {
      const node1 = createMockNode('node1', false);
      initState.collectAlreadyMeasuredItems([node1], []);

      initState.trackNodeMeasurement('node1', createValidSize());
      initState.addPort('node1', createMockPort('port1', 'node1'));

      expect(initState.allEntitiesHaveMeasurements()).toBe(false);
    });

    it('should ignore measurements for nodes not in nodesToMeasure', () => {
      // Only track node1, but measure both node1 and node2
      const node1 = createMockNode('node1', false);
      initState.collectAlreadyMeasuredItems([node1], []);

      initState.trackNodeMeasurement('node1', createValidSize());
      initState.trackNodeMeasurement('node2', createValidSize()); // Not tracked

      // Should still pass because node1 (the only tracked node) is measured
      expect(initState.allEntitiesHaveMeasurements()).toBe(true);
    });
  });

  describe('applyToDiagramState', () => {
    let mockFlowCore: {
      getState: Mock;
      setState: Mock;
    } & FlowCore;

    beforeEach(() => {
      mockFlowCore = {
        getState: vi.fn(),
        setState: vi.fn(),
      } as typeof mockFlowCore;
    });

    it('should apply node sizes to state', () => {
      const node = createMockNode('node1', false);
      mockFlowCore.getState.mockReturnValue({
        nodes: [node],
        edges: [],
      });

      initState.trackNodeMeasurement('node1', createValidSize());
      initState.applyToDiagramState(mockFlowCore);

      expect(mockFlowCore.setState).toHaveBeenCalledWith({
        nodes: [{ ...node, size: createValidSize(), measuredPorts: undefined }],
        edges: [],
      });
    });

    it('should add new ports to nodes', () => {
      const node = createMockNode('node1', true);
      mockFlowCore.getState.mockReturnValue({
        nodes: [node],
        edges: [],
      });

      const port = createMockPort('port1', 'node1');
      initState.addPort('node1', port);
      initState.trackPortMeasurement('node1', 'port1', createValidSize(), createValidPosition());
      initState.applyToDiagramState(mockFlowCore);

      expect(mockFlowCore.setState).toHaveBeenCalled();
      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.nodes[0].measuredPorts).toHaveLength(1);
      expect(setStateCall.nodes[0].measuredPorts[0].id).toBe('port1');
    });

    it('should merge new ports with existing ports', () => {
      const existingPort = createMockPort('port1', 'node1');
      const node: Node = { ...createMockNode('node1', true), measuredPorts: [existingPort] };

      mockFlowCore.getState.mockReturnValue({
        nodes: [node],
        edges: [],
      });

      const newPort = createMockPort('port2', 'node1');
      initState.addPort('node1', newPort);
      initState.trackPortMeasurement('node1', 'port2', createValidSize(), createValidPosition());
      initState.applyToDiagramState(mockFlowCore);

      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.nodes[0].measuredPorts).toHaveLength(2);
    });

    it('should give priority to new ports over existing ports with same id', () => {
      const existingPort = createMockPort('port1', 'node1');
      existingPort.type = 'target';
      const node: Node = { ...createMockNode('node1', true), measuredPorts: [existingPort] };

      mockFlowCore.getState.mockReturnValue({
        nodes: [node],
        edges: [],
      });

      const newPort = createMockPort('port1', 'node1');
      newPort.type = 'source';
      initState.addPort('node1', newPort);
      initState.trackPortMeasurement('node1', 'port1', createValidSize(), createValidPosition());
      initState.applyToDiagramState(mockFlowCore);

      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.nodes[0].measuredPorts[0].type).toBe('source');
    });

    it('should apply port measurements', () => {
      const node = createMockNode('node1', true);
      mockFlowCore.getState.mockReturnValue({
        nodes: [node],
        edges: [],
      });

      const port = createMockPort('port1', 'node1');
      const newSize = { width: 200, height: 100 };
      const newPosition = { x: 50, y: 60 };
      initState.addPort('node1', port);
      initState.trackPortMeasurement('node1', 'port1', newSize, newPosition);
      initState.applyToDiagramState(mockFlowCore);

      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.nodes[0].measuredPorts[0].size).toEqual(newSize);
      expect(setStateCall.nodes[0].measuredPorts[0].position).toEqual(newPosition);
    });

    it('should add new labels to edges', () => {
      const edge = createMockEdge('edge1');
      mockFlowCore.getState.mockReturnValue({
        nodes: [],
        edges: [edge],
      });

      const label = createMockEdgeLabel('label1');
      initState.addLabel('edge1', label);
      initState.trackLabelMeasurement('edge1', 'label1', createValidSize());
      initState.applyToDiagramState(mockFlowCore);

      expect(mockFlowCore.setState).toHaveBeenCalled();
      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.edges[0].measuredLabels).toHaveLength(1);
      expect(setStateCall.edges[0].measuredLabels[0].id).toBe('label1');
    });

    it('should merge new labels with existing labels', () => {
      const existingLabel = createMockEdgeLabel('label1');
      const edge: Edge = { ...createMockEdge('edge1'), measuredLabels: [existingLabel] };

      mockFlowCore.getState.mockReturnValue({
        nodes: [],
        edges: [edge],
      });

      const newLabel = createMockEdgeLabel('label2');
      initState.addLabel('edge1', newLabel);
      initState.trackLabelMeasurement('edge1', 'label2', createValidSize());
      initState.applyToDiagramState(mockFlowCore);

      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.edges[0].measuredLabels).toHaveLength(2);
    });

    it('should give priority to new labels over existing labels with same id', () => {
      const existingLabel = createMockEdgeLabel('label1');
      existingLabel.positionOnEdge = 0.3;
      const edge: Edge = { ...createMockEdge('edge1'), measuredLabels: [existingLabel] };

      mockFlowCore.getState.mockReturnValue({
        nodes: [],
        edges: [edge],
      });

      const newLabel = createMockEdgeLabel('label1');
      newLabel.positionOnEdge = 0.7;
      initState.addLabel('edge1', newLabel);
      initState.trackLabelMeasurement('edge1', 'label1', createValidSize());
      initState.applyToDiagramState(mockFlowCore);

      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.edges[0].measuredLabels[0].positionOnEdge).toBe(0.7);
    });

    it('should apply label measurements', () => {
      const edge = createMockEdge('edge1');
      mockFlowCore.getState.mockReturnValue({
        nodes: [],
        edges: [edge],
      });

      const label = createMockEdgeLabel('label1');
      const newSize = { width: 150, height: 40 };
      initState.addLabel('edge1', label);
      initState.trackLabelMeasurement('edge1', 'label1', newSize);
      initState.applyToDiagramState(mockFlowCore);

      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.edges[0].measuredLabels[0].size).toEqual(newSize);
    });

    it('should preserve other state properties', () => {
      mockFlowCore.getState.mockReturnValue({
        nodes: [],
        edges: [],
        metadata: { viewport: { x: 0, y: 0, zoom: 1 } },
        otherProp: 'test',
      });

      initState.applyToDiagramState(mockFlowCore);

      const setStateCall = mockFlowCore.setState.mock.calls[0][0];
      expect(setStateCall.metadata).toEqual({ viewport: { x: 0, y: 0, zoom: 1 } });
      expect(setStateCall.otherProp).toBe('test');
    });
  });
});
