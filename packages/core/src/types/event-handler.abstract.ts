import type { CommandHandler } from './command-handler.interface';
import type { Event } from './event.interface';

/**
 * TODO: This should be replaced with a proper action type once it's defined
 * For now, we use string as a placeholder
 */
export type Action = string;

/**
 * Type for predicate function that determines if an action should be triggered
 */
export type ActionPredicate = (event: Event) => boolean;

/**
 * Type for action that can be either a name or a function
 */
export type ActionOrName = Action | ((event: Event) => void);

/**
 * Abstract class for handling commands and actions
 * Enforces CommandHandler dependency through constructor
 */
export abstract class EventHandler {
  protected constructor(protected readonly interpreter: CommandHandler) {}

  /**
   * Unregister a default action handler
   * @param action Name of the action to unregister
   */
  abstract unregisterDefault(action: Action): void;

  /**
   * Register a new action handler with a predicate
   * @param predicate Function that determines when the action should be triggered
   * @param action Action to be triggered (either name or function)
   */
  abstract register(predicate: ActionPredicate, action: ActionOrName): void;

  /**
   * Unregister an action handler with a predicate
   * @param predicate Predicate function to unregister
   * @param action Action to unregister
   */
  abstract unregister(predicate: ActionPredicate, action: ActionOrName): void;

  /**
   * Invoke an action by name
   * @param action Name of the action to invoke
   */
  abstract invoke(action: Action): void;
}
