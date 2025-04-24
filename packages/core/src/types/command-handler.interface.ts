/**
 * Type for system commands that can be emitted by InputEventHandler or user
 */
export type Command = { type: 'select'; data: { id: string } } | { type: 'unselect'; data: { id: string } };

/**
 * Type for command callback function
 */
export type CommandCallback = (event: Command) => void;

/**
 * Interface for interpreting and routing system commands
 * This is a core component that handles commands from InputEventHandler or user
 */
export interface CommandHandler {
  /**
   * Emit a system command
   * @param command Command to emit
   */
  emit(command: Command): void;

  /**
   * Register a callback for specific command types
   * @param commandType Type of command to listen for
   * @param callback Function to be called when command occurs
   */
  register(commandType: Command['type'], callback: CommandCallback): void;
}
