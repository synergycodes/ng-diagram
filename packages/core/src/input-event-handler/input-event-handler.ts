import {
  type ActionName,
  type ActionOrActionName,
  type ActionPredicate,
  type ActionWithPredicate,
  InputEventHandler as CoreInputEventHandler,
  type Event,
  FlowCore,
} from '@angularflow/core';
import { actions } from './actions';

export class InputEventHandler extends CoreInputEventHandler {
  private defaultActions = new Map<ActionName, ActionWithPredicate>();
  private registeredActions: ActionWithPredicate[] = [];

  constructor(flowCore: FlowCore) {
    super(flowCore);
    this.flowCore.eventMapper.register((event) => this.handleEvent(event));
    for (const [name, { action, predicate }] of Object.entries(actions)) {
      this.defaultActions.set(name as ActionName, { action, predicate });
      this.register(predicate, action);
    }
  }

  private handleEvent(event: Event): void {
    for (const { predicate, action } of this.registeredActions) {
      if (predicate(event, this.flowCore)) {
        action(event, this.flowCore);
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
    action(event, this.flowCore);
  }
}
