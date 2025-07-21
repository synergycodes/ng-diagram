import { FlowCore } from '../flow-core';
import type { Event } from './event.interface';

/**
 * Type for action name
 */
export type InputActionName =
  | 'select'
  | 'keyboardMoveSelection'
  | 'pointerMoveSelection'
  | 'deleteSelection'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'panning'
  | 'linking'
  | 'resize'
  | 'zooming'
  | 'rotate';

/**
 * Type for action function
 */
export type InputAction = (event: Event, flowCore: FlowCore) => void;

/**
 * Type for predicate function that determines if an action should be triggered
 */
export type InputActionPredicate = (event: Event, flowCore: FlowCore) => boolean;

/**
 * Type for action that can be either a name or a function
 */
export type InputActionOrInputActionName = InputActionName | InputAction;

export interface InputActionWithPredicate {
  action: InputAction;
  predicate: InputActionPredicate;
}

/**
 * Abstract class for handling commands and actions
 * Enforces CommandHandler dependency through constructor
 */
export abstract class InputEventHandler {
  protected constructor(readonly flowCore: FlowCore) {}

  /**
   * Register a default action handler
   * @param actionName Name of the action to register
   */
  abstract registerDefault(actionName: InputActionName): void;

  /**
   * Unregister a default action handler
   * @param actionName Name of the action to unregister
   */
  abstract unregisterDefault(actionName: InputActionName): void;

  /**
   * Register a new action handler with a predicate
   * @param predicate Function that determines when the action should be triggered
   * @param actionOrActionName Action to be triggered (either name or function)
   * @returns A function to unregister the action handler
   */
  abstract register(predicate: InputActionPredicate, actionOrActionName: InputActionOrInputActionName): void;

  /**
   * Invoke an action handler
   * @param actionName Name of the action to invoke
   * @param event Event to invoke the action with
   */
  abstract invoke(actionName: InputActionName, event: Event): void;
}
