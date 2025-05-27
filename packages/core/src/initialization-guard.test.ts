import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from './flow-core';
import { InitializationGuard } from './initialization-guard';
import { mockEdgeLabel, mockPort } from './test-utils';

describe('InitializationGuard', () => {
  const stateMock = { nodes: [], edges: [], metadata: {} };
  const onInitializedMock = vi.fn();
  const getStateMock = vi.fn();
  const setStateMock = vi.fn();
  let flowCore: FlowCore;
  let initializationGuard: InitializationGuard;

  beforeEach(() => {
    flowCore = {
      getState: getStateMock,
      setState: setStateMock,
    } as unknown as FlowCore;
    initializationGuard = new InitializationGuard(flowCore);
    vi.clearAllMocks();
  });

  it('should call onInitialized when there are no nodes or edges', () => {
    getStateMock.mockReturnValue(stateMock);

    initializationGuard.start(onInitializedMock);

    expect(onInitializedMock).toHaveBeenCalled();
  });

  it('should call onInitialized when everything has been initialized', () => {
    const node = { id: '1', ports: [{ id: '1', type: 'input' }] };
    const edge = { id: '1', source: '1', target: '2', labels: [{ id: '1', type: 'label' }] };
    getStateMock.mockReturnValue({ ...stateMock, nodes: [node], edges: [edge] });

    initializationGuard.start(onInitializedMock);

    expect(onInitializedMock).not.toHaveBeenCalled();

    initializationGuard.initNodeSize('1', { width: 100, height: 100 });
    initializationGuard.initPortSizeAndPosition('1', '1', { width: 100, height: 100 }, { x: 0, y: 0 });
    initializationGuard.initEdgeLabelSize('1', '1', { width: 100, height: 100 });

    expect(onInitializedMock).toHaveBeenCalled();
  });

  describe('initNodeSize', () => {
    it('should not call setState if the node has not been initialized', () => {
      getStateMock.mockReturnValue(stateMock);

      initializationGuard.start(onInitializedMock);
      initializationGuard.initNodeSize('1', { width: 100, height: 100 });

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should not call setState if the node has already been initialized with size', () => {
      getStateMock.mockReturnValue({ ...stateMock, nodes: [{ id: '1', size: { width: 100, height: 100 } }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.initNodeSize('1', { width: 100, height: 100 });

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should call setState if the node has not been initialized with size', () => {
      getStateMock.mockReturnValue({ ...stateMock, nodes: [{ id: '1' }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.initNodeSize('1', { width: 100, height: 100 });

      expect(setStateMock).toHaveBeenCalledWith({
        ...stateMock,
        nodes: [{ id: '1', size: { width: 100, height: 100 } }],
      });
    });
  });

  describe('addPort', () => {
    it('should not call setState if the port has been already added', () => {
      getStateMock.mockReturnValue({ ...stateMock, nodes: [{ id: '1', ports: [mockPort] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.addPort('1', mockPort);

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should call setState if the port has not been added', () => {
      getStateMock.mockReturnValue({ ...stateMock, nodes: [{ id: '1', ports: [] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.addPort('1', mockPort);

      expect(setStateMock).toHaveBeenCalledWith({
        ...stateMock,
        nodes: [{ id: '1', ports: [mockPort] }],
      });
    });
  });

  describe('initPortSizeAndPosition', () => {
    it('should not call setState if the port has not been added', () => {
      getStateMock.mockReturnValue({ ...stateMock, nodes: [{ id: '1', ports: [] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.initPortSizeAndPosition('1', '1', { width: 100, height: 100 }, { x: 0, y: 0 });

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should not call setState if the port has already been initialized', () => {
      getStateMock.mockReturnValue({ ...stateMock, nodes: [{ id: '1', ports: [mockPort] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.initPortSizeAndPosition('1', '1', { width: 100, height: 100 }, { x: 0, y: 0 });

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should call setState if the port has not been initialized', () => {
      getStateMock.mockReturnValue({ ...stateMock, nodes: [{ id: '1', ports: [] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.addPort('1', { ...mockPort, size: undefined, position: undefined });
      getStateMock.mockReturnValue({
        ...stateMock,
        nodes: [{ id: '1', ports: [{ ...mockPort, size: undefined, position: undefined }] }],
      });
      initializationGuard.initPortSizeAndPosition('1', mockPort.id, { width: 100, height: 100 }, { x: 0, y: 0 });

      expect(setStateMock).toHaveBeenCalledWith({
        ...stateMock,
        nodes: [{ id: '1', ports: [{ ...mockPort, size: { width: 100, height: 100 }, position: { x: 0, y: 0 } }] }],
      });
    });
  });

  describe('addEdgeLabel', () => {
    it('should not call setState if the edge label has been already added', () => {
      getStateMock.mockReturnValue({
        ...stateMock,
        edges: [{ id: '1', labels: [{ ...mockEdgeLabel, size: undefined }] }],
      });

      initializationGuard.start(onInitializedMock);
      initializationGuard.addEdgeLabel('1', mockEdgeLabel);

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should call setState if the edge label has not been added', () => {
      getStateMock.mockReturnValue({ ...stateMock, edges: [{ id: '1', labels: [] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.addEdgeLabel('1', mockEdgeLabel);

      expect(setStateMock).toHaveBeenCalledWith({
        ...stateMock,
        edges: [{ id: '1', labels: [mockEdgeLabel] }],
      });
    });
  });

  describe('initEdgeLabelSize', () => {
    it('should not call setState if the edge label has not been added', () => {
      getStateMock.mockReturnValue({ ...stateMock, edges: [{ id: '1', labels: [] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.initEdgeLabelSize('1', '1', { width: 100, height: 100 });

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should not call setState if the edge label has already been initialized', () => {
      getStateMock.mockReturnValue({ ...stateMock, edges: [{ id: '1', labels: [mockEdgeLabel] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.initEdgeLabelSize('1', '1', { width: 100, height: 100 });

      expect(setStateMock).not.toHaveBeenCalled();
    });

    it('should call setState if the edge label has not been initialized', () => {
      getStateMock.mockReturnValue({ ...stateMock, edges: [{ id: '1', labels: [] }] });

      initializationGuard.start(onInitializedMock);
      initializationGuard.addEdgeLabel('1', { ...mockEdgeLabel, size: undefined });
      getStateMock.mockReturnValue({
        ...stateMock,
        edges: [{ id: '1', labels: [{ ...mockEdgeLabel, size: undefined }] }],
      });
      initializationGuard.initEdgeLabelSize('1', mockEdgeLabel.id, { width: 100, height: 100 });

      expect(setStateMock).toHaveBeenCalledWith({
        ...stateMock,
        edges: [{ id: '1', labels: [{ ...mockEdgeLabel, size: { width: 100, height: 100 } }] }],
      });
    });
  });
});
