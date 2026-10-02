import { createLinkingState } from './linking-gesture';
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
  const { actionStateManager } = commandHandler.flowCore;

  // The pointer/manual handlers install a preliminary linking state BEFORE
  // emitting this command. Every refusal below must clear it, or `isLinking()`
  // stays true forever and blocks all subsequent linking (with the next stray
  // click emitting a phantom edgeDrawEnded).
  const refuse = () => {
    if (actionStateManager.isLinking()) {
      actionStateManager.clearLinking();
    }
  };

  const sourceNode = commandHandler.flowCore.getNodeById(sourceNodeId);
  if (!sourceNode) {
    refuse();
    return;
  }

  if (sourceNode.computedHidden) {
    console.warn(`[ngDiagram] startLinking ignored: source node "${sourceNodeId}" is effectively hidden.`);
    refuse();
    return;
  }

  if (
    sourcePortId &&
    (sourceNode.measuredPorts?.find((port) => port.id === sourcePortId)?.type === 'target' ||
      commandHandler.flowCore.templateVisibilityRegistry?.isPortHidden(sourceNodeId, sourcePortId))
  ) {
    refuse();
    return;
  }

  const position = sourcePortId ? getPortFlowPosition(sourceNode, sourcePortId) : sourceNode.position;

  if (!position) {
    refuse();
    return;
  }

  const temporaryEdge = createTemporaryEdge(commandHandler.flowCore.config, {
    source: sourceNodeId,
    sourcePort: sourcePortId,
    sourcePosition: position,
    target: '',
    targetPosition: position,
  });

  commandHandler.flowCore.actionStateManager.linking = createLinkingState({
    temporaryEdge,
    sourceNodeId,
    sourcePortId: sourcePortId ?? '',
  });

  await commandHandler.flowCore.applyUpdate({}, 'startLinking');
};
