import { DeselectAllCommand, SelectCommand } from '../commands/selection';

/**
 * Type for system commands that can be emitted by InputEventHandler or user
 */
export type Command = SelectCommand | DeselectAllCommand;

/**
 * Type for command name
 */
export type CommandName = Command['name'];

/**
 * Type for command by name
 */
export type CommandByName<N extends CommandName> = Extract<Command, { name: N }>;

/**
 * Type for command without name
 */
export type WithoutName<T> = Omit<T, 'name'>;

/**
 * Type for command without name
 */
export type IsEmpty<T> = keyof WithoutName<T> extends never ? true : false;

/**
 * Type for command callback function
 */
export type CommandCallback = (command: Command) => void;

/**
 * Interface for interpreting and routing system commands
 * This is a core component that handles commands from InputEventHandler or user
 */
export interface CommandHandler {
  /**
   * Emit a system command
   * @param command Command to emit
   */
  emit<K extends CommandName>(
    commandName: K,
    ...rest: IsEmpty<CommandByName<K>> extends true
      ? [] | [props?: WithoutName<CommandByName<K>>]
      : [props: WithoutName<CommandByName<K>>]
  ): void;

  /**
   * Register a callback for specific command types
   * @param commandType Type of command to listen for
   * @param callback Function to be called when command occurs
   */
  register(commandType: Command['name'], callback: CommandCallback): void;
}
