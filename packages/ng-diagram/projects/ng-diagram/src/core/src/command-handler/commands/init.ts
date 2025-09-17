import type { CommandHandler } from '../../types';

export interface InitCommand {
  name: 'init';
}

export const init = async (commandHandler: CommandHandler) => {
  await commandHandler.flowCore.applyUpdate({}, 'init');
};
