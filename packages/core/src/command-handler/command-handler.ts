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
    if (!this.callbacks[commandName]) {
      this.callbacks[commandName] = [];
    }

    const callbacks = this.callbacks[commandName]! as CommandCallback<K>[];
    callbacks.push(callback);

    // Return unregister function
    return () => {
      const callbacks = this.callbacks[commandName]! as CommandCallback<K>[];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
        if (callbacks.length === 0) {
          this.callbacks[commandName] = undefined;
        }
      }
    };
  }
}
