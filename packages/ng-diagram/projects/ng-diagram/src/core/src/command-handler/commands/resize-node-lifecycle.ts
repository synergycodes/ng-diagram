import type { CommandHandler } from '../../types';

export interface ResizeNodeStartCommand {
  name: 'resizeNodeStart';
}

export const resizeNodeStart = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'resizeNodeStart');
};

export interface ResizeNodeStopCommand {
  name: 'resizeNodeStop';
}

export const resizeNodeStop = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'resizeNodeStop');
};
