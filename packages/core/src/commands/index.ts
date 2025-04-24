import { CommandByName, CommandHandler, CommandName, IsEmpty, WithoutName } from '../types/command-handler.interface';
import { deselectAll, select } from './selection';

type CommandHandlerFunction<K extends CommandName> =
  IsEmpty<CommandByName<K>> extends true
    ? (commandHandler: CommandHandler, props?: WithoutName<CommandByName<K>>) => void
    : (commandHandler: CommandHandler, props: WithoutName<CommandByName<K>>) => void;

export const commands: {
  [K in CommandName]: CommandHandlerFunction<K>;
} = {
  select,
  deselectAll,
};
