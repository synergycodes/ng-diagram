import { CommandByName, CommandHandler, CommandName } from '../types/command-handler.interface';
import { deleteSelection } from './delete-selection';
import { moveSelection } from './move-selection';
import { deselectAll, select } from './selection';

export type CommandHandlerFunction<K extends CommandName> = (
  commandHandler: CommandHandler,
  command: CommandByName<K>
) => void;

export type CommandMap = {
  [K in CommandName]: CommandHandlerFunction<K>;
};

export const commands: CommandMap = {
  select,
  deselectAll,
  moveSelection,
  deleteSelection,
};
