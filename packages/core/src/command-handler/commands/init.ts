import type { CommandHandler } from '../../types';

export interface InitCommand {
  name: 'init';
}

export const init = (commandHandler: CommandHandler): void => {
  const state = commandHandler.flowCore.getState();
  const newState = commandHandler.flowCore.middlewareManager.execute(state, state, 'init');
  commandHandler.flowCore.setState(newState);
};
