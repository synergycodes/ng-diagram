import { commands } from './commands';
import { FlowCore } from './flow-core';
import type {
  Command,
  CommandByName,
  CommandCallback,
  CommandHandler,
  CommandName,
  IsEmpty,
  WithoutName,
} from './types/command-handler.interface';
/**
 * Core implementation of CommandHandler interface
 * Handles command emission and registration of callbacks for system commands
 */
export class CoreCommandHandler implements CommandHandler {
  private callbacks = new Map<Command['name'], CommandCallback[]>();

  constructor(protected readonly flowCore: FlowCore) {}

  /**
   * Emit a system command to all registered callbacks for the command type
   * @param commandName Command name
   * @param rest Command props
   */
  emit<K extends CommandName>(
    commandName: K,
    ...rest: IsEmpty<CommandByName<K>> extends true
      ? [] | [props?: WithoutName<CommandByName<K>>]
      : [props: WithoutName<CommandByName<K>>]
  ): void {
    const props = (rest[0] ?? {}) as WithoutName<CommandByName<K>>;
    commands[commandName](this.flowCore, props);

    const callbacks = this.callbacks.get(commandName);
    if (callbacks) {
      for (const callback of callbacks) {
        callback({ name: commandName, ...props } as CommandByName<K>);
      }
    }
  }

  /**
   * Register a callback for specific command types
   * @param commandType Type of command to listen for
   * @param callback Function to be called when command occurs
   * @returns Function to unregister the callback
   */
  register(commandName: Command['name'], callback: CommandCallback): () => void {
    if (!this.callbacks.has(commandName)) {
      this.callbacks.set(commandName, []);
    }

    const callbacks = this.callbacks.get(commandName) as CommandCallback[];
    callbacks.push(callback);

    // Return unregister function
    return () => {
      const callbacks = this.callbacks.get(commandName);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
          if (callbacks.length === 0) {
            this.callbacks.delete(commandName);
          }
        }
      }
    };
  }
}
