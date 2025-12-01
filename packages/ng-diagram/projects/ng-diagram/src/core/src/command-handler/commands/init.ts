import type { CommandHandler } from '../../types';

export interface InitCommand {
  name: 'init';
  /** IDs of nodes currently rendered (for virtualization) */
  renderedNodeIds?: string[];
  /** IDs of edges currently rendered (for virtualization) */
  renderedEdgeIds?: string[];
}

export const init = async (commandHandler: CommandHandler, command: InitCommand) => {
  await commandHandler.flowCore.applyUpdate(
    {
      renderedNodeIds: command.renderedNodeIds,
      renderedEdgeIds: command.renderedEdgeIds,
    },
    'init'
  );
};
