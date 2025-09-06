import type { CommandHandler } from '../../../types';
import { getPortFlowPosition } from '../../../utils';
import { createTemporaryEdge } from './utils';

export interface StartLinkingCommand {
  name: 'startLinking';
  source: string;
  sourcePort?: string;
}

export const startLinking = async (commandHandler: CommandHandler, command: StartLinkingCommand) => {
  const { source: sourceNodeId, sourcePort: sourcePortId } = command;

  const sourceNode = commandHandler.flowCore.getNodeById(sourceNodeId);
  if (!sourceNode) {
    return;
  }

  if (sourcePortId && sourceNode.ports?.find((port) => port.id === sourcePortId)?.type === 'target') {
    return;
  }

  const position = sourcePortId ? getPortFlowPosition(sourceNode, sourcePortId) : sourceNode.position;

  if (!position) {
    return;
  }

  const temporaryEdge = createTemporaryEdge(commandHandler.flowCore.config, {
    source: sourceNodeId,
    sourcePort: sourcePortId,
    sourcePosition: position,
    target: '',
    targetPosition: position,
  });

  commandHandler.flowCore.actionStateManager.linking = {
    temporaryEdge,
    sourceNodeId,
    sourcePortId: sourcePortId ?? '',
  };
};
