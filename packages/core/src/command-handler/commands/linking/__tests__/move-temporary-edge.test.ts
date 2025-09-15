import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../../flow-core';
import { mockNode, mockPort } from '../../../../test-utils';
import type { CommandHandler, Edge, LinkingActionState, Node, Port } from '../../../../types';
import { moveTemporaryEdge, MoveTemporaryEdgeCommand } from '../move-temporary-edge';

vi.mock('../utils', () => ({
  createTemporaryEdge: vi.fn(),
  isProperTargetPort: vi.fn(),
  validateConnection: vi.fn(),
}));

import { createTemporaryEdge, isProperTargetPort, validateConnection } from '../utils';
const mockCreateTemporaryEdge = vi.mocked(createTemporaryEdge);
const mockIsProperTargetPort = vi.mocked(isProperTargetPort);
const mockValidateConnection = vi.mocked(validateConnection);

describe('moveTemporaryEdge', () => {
  let mockCommandHandler: CommandHandler;
  let mockFlowCore: {
    getState: ReturnType<typeof vi.fn>;
    getNearestPortInRange: ReturnType<typeof vi.fn>;
    getNodeById: ReturnType<typeof vi.fn>;
    applyUpdate: ReturnType<typeof vi.fn>;
    config: { linking: { portSnapDistance: number } };
    actionStateManager: {
      linking: LinkingActionState | null;
    };
  };

  const mockTemporaryEdge: Edge = {
    id: 'temp-edge',
    source: 'source-node',
    sourcePort: 'source-port',
    target: '',
    targetPort: '',
    data: {},
  };

  const mockTargetPort: Port = {
    ...mockPort,
    id: 'target-port',
    nodeId: 'target-node',
  };

  const mockTargetNode: Node = {
    ...mockNode,
    id: 'target-node',
    measuredPorts: [mockTargetPort],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      getState: vi.fn(),
      getNearestPortInRange: vi.fn(),
      getNodeById: vi.fn(),
      applyUpdate: vi.fn().mockResolvedValue(undefined),
      config: { linking: { portSnapDistance: 10 } },
      actionStateManager: {
        linking: null,
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

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should return early when target is the same', async () => {
    const existingEdge = {
      ...mockTemporaryEdge,
      target: 'target-node',
      targetPort: 'target-port',
    };

    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: existingEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(mockTargetPort);
    mockIsProperTargetPort.mockReturnValue(true);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should create floating edge when no target port found', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(null);

    const floatingEdge = { ...mockTemporaryEdge, target: '', targetPort: '' };
    mockCreateTemporaryEdge.mockReturnValue(floatingEdge);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
      source: mockTemporaryEdge.source,
      sourcePort: mockTemporaryEdge.sourcePort,
      target: '',
      targetPort: '',
      targetPosition: { x: 100, y: 200 },
    });

    expect(mockFlowCore.actionStateManager.linking).toEqual({
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: floatingEdge,
    });
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'moveTemporaryEdge');
  });

  it('should create connected edge when valid target found', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(mockTargetPort);
    mockIsProperTargetPort.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockValidateConnection.mockReturnValue(true);

    const connectedEdge = {
      ...mockTemporaryEdge,
      target: 'target-node',
      targetPort: 'target-port',
    };
    mockCreateTemporaryEdge.mockReturnValue(connectedEdge);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
      source: mockTemporaryEdge.source,
      sourcePort: mockTemporaryEdge.sourcePort,
      target: 'target-node',
      targetPort: 'target-port',
      targetPosition: { x: 100, y: 200 },
    });

    expect(mockFlowCore.actionStateManager.linking).toEqual({
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: connectedEdge,
    });
    expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith({}, 'moveTemporaryEdge');
  });

  it('should create floating edge when connection validation fails', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(mockTargetPort);
    mockIsProperTargetPort.mockReturnValue(true);
    mockFlowCore.getNodeById.mockReturnValue(mockTargetNode);
    mockValidateConnection.mockReturnValue(false); // Connection invalid

    const floatingEdge = { ...mockTemporaryEdge, target: '', targetPort: '' };
    mockCreateTemporaryEdge.mockReturnValue(floatingEdge);

    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position: { x: 100, y: 200 },
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockValidateConnection).toHaveBeenCalledWith(
      mockFlowCore,
      mockTemporaryEdge.source,
      mockTemporaryEdge.sourcePort,
      'target-node',
      'target-port'
    );

    expect(mockCreateTemporaryEdge).toHaveBeenCalledWith(mockFlowCore.config, {
      source: mockTemporaryEdge.source,
      sourcePort: mockTemporaryEdge.sourcePort,
      target: '',
      targetPort: '',
      targetPosition: { x: 100, y: 200 },
    });
  });

  it('should use port snap distance for target detection', async () => {
    mockFlowCore.actionStateManager.linking = {
      sourceNodeId: 'source-node',
      sourcePortId: 'source-port',
      temporaryEdge: mockTemporaryEdge,
    };
    mockFlowCore.getNearestPortInRange.mockReturnValue(null);
    mockCreateTemporaryEdge.mockReturnValue(mockTemporaryEdge);

    const position = { x: 150, y: 250 };
    const command: MoveTemporaryEdgeCommand = {
      name: 'moveTemporaryEdge',
      position,
    };

    await moveTemporaryEdge(mockCommandHandler, command);

    expect(mockFlowCore.getNearestPortInRange).toHaveBeenCalledWith(
      position,
      mockFlowCore.config.linking.portSnapDistance
    );
  });
});
