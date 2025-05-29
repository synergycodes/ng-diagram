import { CommandHandler, Edge, Node } from '../../types';

function getZOrder(nodes: Node[], edges: Edge[], command: BringToFrontCommand | SendToBackCommand): number {
  if (command.name === 'bringToFront') {
    return Math.max(...nodes.map((node) => node.zOrder ?? 0), ...edges.map((edge) => edge.zOrder ?? 0)) + 1;
  }

  return Math.min(...nodes.map((node) => node.zOrder ?? 0), ...edges.map((edge) => edge.zOrder ?? 0)) - 1;
}

function getCommandTarget(
  commandHandler: CommandHandler,
  command: BringToFrontCommand | SendToBackCommand
): {
  nodeIds: Node['id'][];
  edgeIds: Edge['id'][];
} {
  if (command.nodeIds || command.edgeIds) {
    return { nodeIds: command.nodeIds ?? [], edgeIds: command.edgeIds ?? [] };
  }

  const { nodes, edges } = commandHandler.flowCore.getState();
  return {
    nodeIds: nodes.filter((node) => node.selected).map((node) => node.id),
    edgeIds: edges.filter((edge) => edge.selected).map((edge) => edge.id),
  };
}

export interface BringToFrontCommand {
  name: 'bringToFront';
  nodeIds?: string[];
  edgeIds?: string[];
}

export interface SendToBackCommand {
  name: 'sendToBack';
  nodeIds?: string[];
  edgeIds?: string[];
}

const changeZOrder = (commandHandler: CommandHandler, command: BringToFrontCommand | SendToBackCommand): void => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { nodeIds, edgeIds } = getCommandTarget(commandHandler, command);
  if (nodeIds.length === 0 && edgeIds.length === 0) {
    return;
  }

  const zOrder = getZOrder(nodes, edges, command);
  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: nodeIds.map((id) => ({ id, zOrder })),
      edgesToUpdate: edgeIds.map((id) => ({ id, zOrder })),
    },
    'changeZOrder'
  );
};

export const bringToFront = (commandHandler: CommandHandler, command: BringToFrontCommand): void => {
  changeZOrder(commandHandler, command);
};

export const sendToBack = (commandHandler: CommandHandler, command: SendToBackCommand): void => {
  changeZOrder(commandHandler, command);
};
