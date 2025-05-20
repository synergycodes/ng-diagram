import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockMetadata, mockNode, mockPort } from '../../../test-utils';
import { CommandHandler } from '../../command-handler';
import { getFinalEdge, getTemporaryEdge } from '../linking';

describe('Linking Commands', () => {
  let getStateMock: ReturnType<typeof vi.fn>;
  let getNodeByIdMock: ReturnType<typeof vi.fn>;
  let getFlowPortPositionMock: ReturnType<typeof vi.fn>;
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    getStateMock = vi.fn();
    getNodeByIdMock = vi.fn();
    getFlowPortPositionMock = vi.fn();
    flowCore = {
      getState: getStateMock,
      applyUpdate: vi.fn(),
      getNodeById: getNodeByIdMock,
      getFlowPortPosition: getFlowPortPositionMock,
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('startLinking', () => {
    it('should not call applyUpdate if source node is not found', () => {
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: {} });
      getNodeByIdMock.mockReturnValue(null);

      commandHandler.emit('startLinking', { source: 'node-1' });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should not call applyUpdate if source port is a type of target', () => {
      getStateMock.mockReturnValue({ metadata: {} });
      getNodeByIdMock.mockReturnValue({ ...mockNode, ports: [{ ...mockPort, type: 'target' }] });

      commandHandler.emit('startLinking', { source: mockNode.id, sourcePort: mockPort.id });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should create a temporary edge from node position if port is not provided', () => {
      getStateMock.mockReturnValue({ metadata: {} });
      getNodeByIdMock.mockReturnValue({ id: 'node-1', position: { x: 100, y: 100 } });

      commandHandler.emit('startLinking', { source: 'node-1' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            temporaryEdge: getTemporaryEdge({
              source: 'node-1',
              sourcePosition: { x: 100, y: 100 },
              target: '',
              targetPosition: { x: 100, y: 100 },
            }),
          },
        },
        'startLinking'
      );
    });

    it('should create a temporary edge from port position if port is provided', () => {
      getStateMock.mockReturnValue({ metadata: {} });
      getNodeByIdMock.mockReturnValue({ ...mockNode, ports: [{ ...mockPort, type: 'source' }] });
      getFlowPortPositionMock.mockReturnValue({ x: 100, y: 100 });

      commandHandler.emit('startLinking', { source: mockNode.id, sourcePort: mockPort.id });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            temporaryEdge: getTemporaryEdge({
              source: mockNode.id,
              sourcePort: mockPort.id,
              sourcePosition: { x: 100, y: 100 },
              target: '',
              targetPosition: { x: 100, y: 100 },
            }),
          },
        },
        'startLinking'
      );
    });
  });

  describe('startLinkingFromPosition', () => {
    it('should create a temporary edge', () => {
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: mockMetadata });

      commandHandler.emit('startLinkingFromPosition', { position: { x: 100, y: 100 } });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            ...mockMetadata,
            temporaryEdge: getTemporaryEdge({
              source: '',
              sourcePosition: { x: 100, y: 100 },
              target: '',
              targetPosition: { x: 100, y: 100 },
            }),
          },
        },
        'startLinking'
      );
    });
  });

  describe('moveTemporaryEdge', () => {
    it('should not call applyUpdate if temporary edge is not found', () => {
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: {} });

      commandHandler.emit('moveTemporaryEdge', { position: { x: 100, y: 100 } });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should move the temporary edge', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        target: '',
        targetPosition: { x: 100, y: 100 },
      });
      getStateMock.mockReturnValue({
        nodes: [{ id: 'node-1', position: { x: 100, y: 100 } }],
        edges: [],
        metadata: { ...mockMetadata, temporaryEdge },
      });

      commandHandler.emit('moveTemporaryEdge', { position: { x: 200, y: 200 } });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            ...mockMetadata,
            temporaryEdge: {
              ...temporaryEdge,
              targetPosition: { x: 200, y: 200 },
            },
          },
        },
        'moveTemporaryEdge'
      );
    });
  });

  describe('finishLinking', () => {
    it('should not call applyUpdate if temporary edge is not found', () => {
      getStateMock.mockReturnValue({ nodes: [{ id: 'node-1' }], edges: [], metadata: {} });

      commandHandler.emit('finishLinking', { target: 'node-1' });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should call applyUpdate if there is no target node provided to remove temporary edge', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        target: 'node-2',
        targetPosition: { x: 200, y: 200 },
      });
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: { temporaryEdge } });

      commandHandler.emit('finishLinking', {});

      expect(flowCore.applyUpdate).toHaveBeenCalledWith({ metadata: { temporaryEdge: null } }, 'finishLinking');
    });

    it('should call applyUpdate if there is no target node provided to remove temporary edge', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        target: 'node-2',
        targetPosition: { x: 200, y: 200 },
      });
      getNodeByIdMock.mockReturnValue(null);
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: { temporaryEdge } });

      commandHandler.emit('finishLinking', { target: 'node-2' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith({ metadata: { temporaryEdge: null } }, 'finishLinking');
    });

    it('should call applyUpdate if target port is a type of source to remove temporary edge', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        target: 'node-2',
        targetPosition: { x: 200, y: 200 },
      });
      getNodeByIdMock.mockReturnValue({ ...mockNode, ports: [{ ...mockPort, type: 'source' }] });
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: { temporaryEdge } });

      commandHandler.emit('finishLinking', { target: mockNode.id, targetPort: mockPort.id });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith({ metadata: { temporaryEdge: null } }, 'finishLinking');
    });

    it('should create a new edge and remove the temporary edge if only target node is provided', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      });
      getStateMock.mockReturnValue({
        nodes: [{ id: 'node-1' }, { id: 'node-2' }],
        edges: [],
        metadata: { temporaryEdge },
      });
      getNodeByIdMock.mockReturnValue({ id: 'node-2', position: { x: 200, y: 200 } });

      commandHandler.emit('finishLinking', { target: 'node-2' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: { temporaryEdge: null },
          edges: expect.arrayContaining([
            expect.objectContaining({
              ...getFinalEdge(temporaryEdge, { target: 'node-2', targetPosition: { x: 200, y: 200 } }),
              id: expect.any(String),
            }),
          ]),
        },
        'finishLinking'
      );
    });

    it('should create a new edge and remove the temporary edge if target node and port are provided', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        targetPosition: { x: 200, y: 200 },
      });
      getStateMock.mockReturnValue({
        nodes: [{ id: 'node-1' }, { id: 'node-2' }],
        edges: [],
        metadata: { temporaryEdge },
      });
      getNodeByIdMock.mockReturnValue({
        id: 'node-2',
        ports: [{ id: 'port-2', type: 'target', position: { x: 250, y: 250 } }],
      });
      getFlowPortPositionMock.mockReturnValue({ x: 250, y: 250 });

      commandHandler.emit('finishLinking', { target: 'node-2', targetPort: 'port-2' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: { temporaryEdge: null },
          edges: expect.arrayContaining([
            expect.objectContaining({
              ...getFinalEdge(temporaryEdge, { target: 'node-2', targetPosition: { x: 250, y: 250 } }),
              id: expect.any(String),
            }),
          ]),
        },
        'finishLinking'
      );
    });
  });

  describe('finishLinkingToPosition', () => {
    it('should not call applyUpdate if temporary edge is not found', () => {
      getStateMock.mockReturnValue({ nodes: [{ id: 'node-1' }], edges: [], metadata: mockMetadata });

      commandHandler.emit('finishLinkingToPosition', { position: { x: 100, y: 100 } });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should create a new edge and remove the temporary edge', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        target: '',
        targetPosition: { x: 200, y: 200 },
      });
      getStateMock.mockReturnValue({
        nodes: [{ id: 'node-1' }],
        edges: [],
        metadata: { ...mockMetadata, temporaryEdge },
      });

      commandHandler.emit('finishLinkingToPosition', { position: { x: 100, y: 100 } });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: { ...mockMetadata, temporaryEdge: null },
          edges: expect.arrayContaining([
            expect.objectContaining({
              ...getFinalEdge(temporaryEdge, { target: '', targetPosition: { x: 100, y: 100 } }),
              id: expect.any(String),
            }),
          ]),
        },
        'finishLinking'
      );
    });
  });
});
