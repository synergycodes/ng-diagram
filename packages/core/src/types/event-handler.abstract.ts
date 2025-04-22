import type { CommandHandler } from './command-handler.interface';
import type { EventMapper } from './event-mapper.interface';
import type { Event } from './event.interface';

/**
 * TODO: This should be replaced with a proper action type once it's defined
 * For now, we use string as a placeholder
 */
export type ActionName = 'click';

/**
 * Type for action function
 */
export type Action = (event: Event) => void;

/**
 * Type for predicate function that determines if an action should be triggered
 */
export type ActionPredicate = (event: Event) => boolean;

/**
 * Type for action that can be either a name or a function
 */
export type ActionOrActionName = ActionName | Action;

export interface ActionWithPredicate {
  action: Action;
  predicate: ActionPredicate;
}

/**
 * Abstract class for handling commands and actions
 * Enforces CommandHandler dependency through constructor
 */
export abstract class EventHandler {
  protected constructor(
    protected readonly interpreter: CommandHandler,
    protected readonly eventMapper: EventMapper
  ) {}

  /**
   * Register a default action handler
   * @param actionName Name of the action to register
   */
  abstract registerDefault(actionName: ActionName): void;

  /**
   * Unregister a default action handler
   * @param actionName Name of the action to unregister
   */
  abstract unregisterDefault(actionName: ActionName): void;

  /**
   * Register a new action handler with a predicate
   * @param predicate Function that determines when the action should be triggered
   * @param actionOrActionName Action to be triggered (either name or function)
   */
  abstract register(predicate: ActionPredicate, actionOrActionName: ActionOrActionName): void;

  /**
   * Unregister an action handler with a predicate
   * @param predicate Predicate function to unregister
   * @param actionOrActionName Action to unregister
   */
  abstract unregister(predicate: ActionPredicate, actionOrActionName: ActionOrActionName): void;

  /**
   * Invoke an action by name
   * @param actionName Name of the action to invoke
   * @param event Event to invoke the action with
   */
  abstract invoke(actionName: ActionName, event: Event): void;
}
