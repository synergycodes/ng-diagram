import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockNode } from '../../../../test-utils';
import type { CommandHandler, Edge, Node } from '../../../../types';
import { finishLinking } from '../finish-linking';

// Mock the utility functions
vi.mock('../../../../utils', () => ({
  getPortFlowPosition: vi.fn(),
}));

vi.mock('../utils', () => ({
  createFinalEdge: vi.fn(),
  validateConnection: vi.fn(),
}));

import { getPortFlowPosition } from '../../../../utils';
import { createFinalEdge, validateConnection } from '../utils';
const mockGetPortFlowPosition = vi.mocked(getPortFlowPosition);
const mockCreateFinalEdge = vi.mocked(createFinalEdge);
const mockValidateConnection = vi.mocked(validateConnection);

describe('finishLinking', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getState: ReturnType<typeof vi.fn>;
    getNodeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: object;
  };

  const mockTemporaryEdge: Edge = {
    id: 'temp-edge',
    source: 'source-node',
    sourcePort: 'source-port',
    target: 'target-node',
    targetPort: 'target-port',
    data: {},
  };

  const mockTargetNode: Node = {
    ...mockNode,
    id: 'target-node',
    position: { x: 100, y: 200 },
    ports: [
      {
        id: 'target-port',
        type: 'target',
        side: 'left',
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
        nodeId: 'target-node',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      getNodeById: vi.fn(),
      applyUpdate: vi.fn(),
      config: {},
      actionStateManager: {
        linking: {
          temporaryEdge: null,
        },
        clearLinking: vi.fn(),
        isLinking: vi.fn(() => !!mockFlowCore.actionStateManager.linking),
      },
    };

    mockCommandHandler = {
      flowCore: mockFlowCore as unknown as FlowCore,
      emit: vi.fn(),
      register: vi.fn(),
    } as unknown as CommandHandler;
  });

  it('should return early when no temporary edge exists', async () => {
    mockFlowCore.actionStateManager.linking = null;
    await finishLinking(mockCommandHandler);
    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should clear temporary edge when connection validation fails', async () => {
    mockFlowCore.actionStateManager.linking = { temporaryEdge: mockTemporaryEdge };
    mockValidateConnection.mockReturnValue(false);

    await finishLinking(mockCommandHandler);

    expect(mockValidateConnection).toHaveBeenCalledWith(
      mockFlowCore,
      'source-node',
      'source-port',
      'target-node',
      'target-port',
      true
    );

    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear temporary edge when target node does not exist', async () => {
    mockFlowCore.actionStateManager.linking = { temporaryEdge: mockTemporaryEdge };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(null);

    await finishLinking(mockCommandHandler);

    expect(mockFlowCore.getNodeById).toHaveBeenCalledWith('target-node');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear temporary edge when target port is source type', async () => {
    const targetNodeWithSourcePort = {
      ...mockTargetNode,
      ports: [
        {
          id: 'target-port',
          type: 'source', // Invalid for target
          side: 'right',
          position: { x: 0, y: 0 },
          size: { width: 10, height: 10 },
          nodeId: 'target-node',
        },
      ],
    };

    mockFlowCore.actionStateManager.linking = { temporaryEdge: mockTemporaryEdge };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(targetNodeWithSourcePort);

    await finishLinking(mockCommandHandler);

    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should clear temporary edge when target position cannot be determined', async () => {
    mockFlowCore.actionStateManager.linking = { temporaryEdge: mockTemporaryEdge };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockGetPortFlowPosition.mockReturnValue(null); // No position available

    await finishLinking(mockCommandHandler);

    expect(mockGetPortFlowPosition).toHaveBeenCalledWith(mockTargetNode, 'target-port');
    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should create final edge when all validations pass with port', async () => {
    const targetPosition = { x: 150, y: 250 };
    const finalEdge = {
      id: 'final-edge',
      source: 'source-node',
      target: 'target-node',
      data: {},
    };

    mockFlowCore.actionStateManager.linking = { temporaryEdge: mockTemporaryEdge };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockGetPortFlowPosition.mockReturnValue(targetPosition);
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    await finishLinking(mockCommandHandler);

    expect(mockCreateFinalEdge).toHaveBeenCalledWith(mockFlowCore.config, mockTemporaryEdge, {
      target: 'target-node',
      targetPort: 'target-port',
      targetPosition,
    });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );

    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });

  it('should create final edge using node position when no port specified', async () => {
    const temporaryEdgeWithoutPort = {
      ...mockTemporaryEdge,
      target: 'target-node',
      targetPort: '',
    };
    const finalEdge = { id: 'final-edge', source: 'source-node', target: 'target-node', data: {} };

    mockFlowCore.actionStateManager.linking = { temporaryEdge: temporaryEdgeWithoutPort };
    mockValidateConnection.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockCreateFinalEdge.mockReturnValue(finalEdge);

    await finishLinking(mockCommandHandler);

    expect(mockCreateFinalEdge).toHaveBeenCalledWith(mockFlowCore.config, temporaryEdgeWithoutPort, {
      target: 'target-node',
      targetPort: undefined,
      targetPosition: mockTargetNode.position,
    });

    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
      {
        edgesToAdd: [finalEdge],
      },
      'finishLinking'
    );

    expect(mockFlowCore.actionStateManager.clearLinking).toHaveBeenCalled();
  });
});
