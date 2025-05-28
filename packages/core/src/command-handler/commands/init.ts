import type { CommandHandler } from '../../types';

export interface InitCommand {
  name: 'init';
}

export const init = async (commandHandler: CommandHandler): Promise<void> => {
  const state = commandHandler.flowCore.getState();
  commandHandler.flowCore.applyUpdate(state, 'init');
};
