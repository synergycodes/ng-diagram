import type { CommandHandler } from '../../types';

export interface InitCommand {
  name: 'init';
}

export const init = async (commandHandler: CommandHandler): Promise<void> => {
  commandHandler.flowCore.applyUpdate({}, 'init');
};
