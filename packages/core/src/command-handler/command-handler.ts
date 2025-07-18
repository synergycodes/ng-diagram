import { FlowCore } from '../flow-core';
import type {
  CommandByName,
  CommandCallback,
  CommandName,
  CommandHandler as CoreCommandHandler,
  IsEmpty,
  WithoutName,
} from '../types/command-handler.interface';
import { CommandHandlerFunction, commands } from './commands';

/**
 * Core implementation of CommandHandler interface
 * Handles command emission and registration of callbacks for system commands
 */
export class CommandHandler implements CoreCommandHandler {
  private callbacks: {
    [K in CommandName]?: CommandCallback<K>[];
  } = {};
  readonly flowCore: FlowCore;

  constructor(flowCore: FlowCore) {
    this.flowCore = flowCore;
    (Object.entries(commands) as [CommandName, CommandHandlerFunction<CommandName>][]).forEach(([commandName, fn]) => {
      this.register(commandName, (command) => {
        fn(this, command);
      });
    });
  }

  /**
   * Emit a system command to all registered callbacks for the command type
   * @param commandName Command name
   * @param rest Command props
   */
  async emit<K extends CommandName>(
    commandName: K,
    ...props: IsEmpty<CommandByName<K>> extends true
      ? [] | [WithoutName<CommandByName<K>>]
      : [WithoutName<CommandByName<K>>]
  ): Promise<void> {
    const callbacks = this.callbacks[commandName];

    if (callbacks) {
      const command = { name: commandName, ...props[0] } as CommandByName<K>;
      await Promise.all(callbacks.map((callback) => callback(command)));
    }
  }

  /**
   * Register a callback for specific command types
   * @param commandName Type of command to listen for
   * @param callback Function to be called when command occurs
   * @returns Function to unregister the callback
   */
  register<K extends CommandName>(commandName: K, callback: CommandCallback<K>): () => void {
    const callbacks = this.getCommandCallbacks(commandName);
    callbacks.push(callback);

    const unregister = () => {
      const callbacks = this.getCommandCallbacks(commandName);
      const filteredCallbacks = callbacks.filter(
        (comparedCallback) => comparedCallback !== callback
      ) as (typeof this.callbacks)[typeof commandName];

      this.callbacks[commandName] = filteredCallbacks;
    };

    return unregister;
  }

  private getCommandCallbacks<K extends CommandName>(commandName: K): CommandCallback<K>[] {
    if (!this.callbacks[commandName]) {
      this.callbacks[commandName] = [];
    }

    return this.callbacks[commandName];
  }
}
