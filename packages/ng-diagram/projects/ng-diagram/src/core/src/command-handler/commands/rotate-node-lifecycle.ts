import type { CommandHandler } from '../../types';

export interface RotateNodeStartCommand {
  name: 'rotateNodeStart';
}

export const rotateNodeStart = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'rotateNodeStart');
};

export interface RotateNodeStopCommand {
  name: 'rotateNodeStop';
}

export const rotateNodeStop = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'rotateNodeStop');
};
