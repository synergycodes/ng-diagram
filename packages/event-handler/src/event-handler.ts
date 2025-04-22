import {
  type ActionName,
  type ActionOrActionName,
  type ActionPredicate,
  type ActionWithPredicate,
  type CommandHandler,
  EventHandler as CoreEventHandler,
  type Event,
  type EventMapper,
} from '@angularflow/core';

// TODO: Replace with proper default actions
const DEFAULT_ACTIONS: Record<ActionName, ActionWithPredicate> = {
  click: { action: () => null, predicate: () => true },
};

export class EventHandler extends CoreEventHandler {
  private defaultActions = new Map<ActionName, ActionWithPredicate>();
  private registeredActions: ActionWithPredicate[] = [];

  constructor(
    protected readonly interpreter: CommandHandler,
    protected readonly eventMapper: EventMapper
  ) {
    super(interpreter, eventMapper);
    this.eventMapper.register((event) => this.handleEvent(event));
    for (const [name, { action, predicate }] of Object.entries(DEFAULT_ACTIONS)) {
      this.defaultActions.set(name as ActionName, { action, predicate });
      this.register(predicate, action);
    }
  }

  private handleEvent(event: Event): void {
    for (const { predicate, action } of this.registeredActions) {
      if (predicate(event)) {
        action(event);
      }
    }
  }

  registerDefault(actionName: ActionName): void {
    const actionWithPredicate = this.defaultActions.get(actionName);
    if (!actionWithPredicate) {
      throw new Error(`Default action "${actionName}" does not exist.`);
    }
    this.unregisterDefault(actionName);
    this.register(actionWithPredicate.predicate, actionWithPredicate.action);
  }

  unregisterDefault(actionName: ActionName): void {
    const actionWithPredicate = this.defaultActions.get(actionName);
    if (!actionWithPredicate) {
      throw new Error(`Default action "${actionName}" does not exist.`);
    }
    this.unregister(actionWithPredicate.predicate, actionWithPredicate.action);
  }

  register(predicate: ActionPredicate, actionOrActionName: ActionOrActionName): void {
    const action =
      typeof actionOrActionName === 'string' ? this.defaultActions.get(actionOrActionName)?.action : actionOrActionName;

    if (!action) {
      throw new Error(`Action "${actionOrActionName}" not found among default actions.`);
    }

    this.registeredActions.push({ predicate, action });
  }

  unregister(predicate: ActionPredicate, actionOrActionName: ActionOrActionName): void {
    this.registeredActions = this.registeredActions.filter(
      (handler) =>
        handler.predicate !== predicate ||
        handler.action !==
          (typeof actionOrActionName === 'string'
            ? this.defaultActions.get(actionOrActionName)?.action
            : actionOrActionName)
    );
  }

  invoke(actionName: ActionName, event: Event): void {
    const action = this.defaultActions.get(actionName)?.action;
    if (!action) {
      throw new Error(`Default action "${actionName}" does not exist.`);
    }
    action(event);
  }

  /**
   * @internal
   * Overwrites default action for given action name.
   * @param actionName - Action name to overwrite.
   * @param actionWithPredicate - Action with predicate to set as default.
   */
  __overwriteDefaultAction(actionName: ActionName, actionWithPredicate: ActionWithPredicate): void {
    this.unregisterDefault(actionName);
    this.defaultActions.set(actionName, actionWithPredicate);
    this.register(actionWithPredicate.predicate, actionWithPredicate.action);
  }
}
