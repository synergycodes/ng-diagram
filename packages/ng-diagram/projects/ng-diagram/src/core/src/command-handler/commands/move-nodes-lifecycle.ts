import type { CommandHandler } from '../../types';

export interface MoveNodesStartCommand {
  name: 'moveNodesStart';
}

export const moveNodesStart = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'moveNodesStart');
};

export interface MoveNodesStopCommand {
  name: 'moveNodesStop';
}

export const moveNodesStop = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'moveNodesStop');
};
