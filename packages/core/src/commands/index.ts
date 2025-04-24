import { FlowCore } from '../flow-core';
import { CommandByName, CommandName, IsEmpty, WithoutName } from '../types/command-handler.interface';
import { deselectAll, select } from './selection';

type CommandHandlerFunction<K extends CommandName> =
  IsEmpty<CommandByName<K>> extends true
    ? (flowCore: FlowCore, props?: WithoutName<CommandByName<K>>) => void
    : (flowCore: FlowCore, props: WithoutName<CommandByName<K>>) => void;

export const commands: {
  [K in CommandName]: CommandHandlerFunction<K>;
} = {
  select,
  deselectAll,
};
