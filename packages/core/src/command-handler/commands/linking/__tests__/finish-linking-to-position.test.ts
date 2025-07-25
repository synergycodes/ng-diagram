import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import type { CommandHandler, Edge } from '../../../../types';
import { finishLinkingToPosition, FinishLinkingToPositionCommand } from '../finish-linking-to-position';

// Mock the utility functions
vi.mock('../utils', () => ({
  createFinalEdge: vi.fn(),
}));

import { createFinalEdge } from '../utils';
const mockCreateFinalEdge = vi.mocked(createFinalEdge);

describe('finishLinkingToPosition', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getState: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: object;
  };

  const mockTemporaryEdge: Edge = {
    id: 'temp-edge',
    source: 'source-node',
    sourcePort: 'source-port',
    target: '',
    targetPort: '',
    data: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      config: {},
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
      register: vi.fn(),
    } as unknown as CommandHandler;
  });

  it('should return early when no temporary edge exists', async () => {
    mockFlowCore.getState.mockReturnValue({ metadata: {} });

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position: { x: 100, y: 200 },
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should create final edge to position when temporary edge exists', async () => {
    const position = { x: 150, y: 250 };
    const finalEdge = {
      id: 'final-edge',
      source: 'source-node',
      target: '',
      data: {},
    };

    mockFlowCore.getState.mockReturnValue({
      metadata: { temporaryEdge: mockTemporaryEdge },
    });
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position,
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockCreateFinalEdge).toHaveBeenCalledWith(mockFlowCore.config, mockTemporaryEdge, {
      target: '',
      targetPort: '',
      targetPosition: position,
    });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        metadataUpdate: { temporaryEdge: null },
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );
  });

  it('should always create edge with empty target and targetPort', async () => {
    const position = { x: 300, y: 400 };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: '', data: {} };

    mockFlowCore.getState.mockReturnValue({
      metadata: { temporaryEdge: mockTemporaryEdge },
    });
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position,
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    // Verify that target and targetPort are always empty strings
    const createFinalEdgeCall = mockCreateFinalEdge.mock.calls[0][2];
    expect(createFinalEdgeCall.target).toBe('');
    expect(createFinalEdgeCall.targetPort).toBe('');
    expect(createFinalEdgeCall.targetPosition).toEqual(position);
  });

  it('should clear temporary edge', async () => {
    const position = { x: 500, y: 600 };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: '', data: {} };

    mockFlowCore.getState.mockReturnValue({
      metadata: { temporaryEdge: mockTemporaryEdge },
    });
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    const command: FinishLinkingToPositionCommand = {
      name: 'finishLinkingToPosition',
      position,
    };

    await finishLinkingToPosition(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        metadataUpdate: { temporaryEdge: null },
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );
  });
});
