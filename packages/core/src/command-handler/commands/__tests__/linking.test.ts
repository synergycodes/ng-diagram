import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockMetadata } from '../../../test-utils';
import { CommandHandler } from '../../command-handler';
import { getFinalEdge, getTemporaryEdge } from '../linking';

describe('Linking Commands', () => {
  let getStateMock: ReturnType<typeof vi.fn>;
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    getStateMock = vi.fn();
    flowCore = {
      getState: getStateMock,
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('startLinking', () => {
    it('should not call applyUpdate if source node is not found', () => {
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: {} });

      commandHandler.emit('startLinking', { source: 'node-1' });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should create a temporary edge', () => {
      getStateMock.mockReturnValue({
        nodes: [{ id: 'node-1', position: { x: 100, y: 100 } }],
        edges: [],
        metadata: {},
      });

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

    it('should not call applyUpdate if target node is not found', () => {
      const temporaryEdge = getTemporaryEdge({
        source: 'node-1',
        sourcePosition: { x: 100, y: 100 },
        target: 'node-2',
        targetPosition: { x: 200, y: 200 },
      });
      getStateMock.mockReturnValue({ nodes: [], edges: [], metadata: { temporaryEdge } });

      commandHandler.emit('finishLinking', { target: 'node-1' });

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
        nodes: [{ id: 'node-1' }, { id: 'node-2' }],
        edges: [],
        metadata: { temporaryEdge },
      });

      commandHandler.emit('finishLinking', { target: 'node-2' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: { temporaryEdge: null },
          edges: expect.arrayContaining([
            expect.objectContaining({
              ...getFinalEdge(temporaryEdge, { target: 'node-2' }),
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
