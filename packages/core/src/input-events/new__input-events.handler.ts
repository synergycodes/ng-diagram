// import { FlowCore } from '../flow-core';
// import {
//   InputEventHandler as CoreInputEventHandler,
//   InputActionName,
//   InputActionOrInputActionName,
//   InputActionPredicate,
//   type Event,
//   type InputActionWithPredicate,
// } from '../types';
// import { inputActions } from './input-actions';

import { FlowCore } from '../flow-core';

export class __NEW__InputEventHandler {
  // private defaultActions = new Map<InputActionName, InputActionWithPredicate>();
  // private registeredActions: InputActionWithPredicate[] = [];
  constructor(flowCore: FlowCore) {
    // super(flowCore);
    // this.flowCore.registerEventsHandler((event) => this.handleEvent(event));
    // for (const [name, { action, predicate }] of Object.entries(inputActions)) {
    //   this.defaultActions.set(name as InputActionName, { action, predicate });
    //   this.register(predicate, action);
    // }
  }
  // private handleEvent(event: Event): void {
  //   for (const { predicate, action } of this.registeredActions) {
  //     if (predicate(event, this.flowCore)) {
  //       action(event, this.flowCore);
  //     }
  //   }
  // }
  // registerDefault(actionName: InputActionName): void {
  //   const actionWithPredicate = this.defaultActions.get(actionName);
  //   if (!actionWithPredicate) {
  //     throw new Error(`Default action "${actionName}" does not exist.`);
  //   }
  //   this.unregisterDefault(actionName);
  //   this.register(actionWithPredicate.predicate, actionWithPredicate.action);
  // }
  // unregisterDefault(actionName: InputActionName): void {
  //   const actionWithPredicate = this.defaultActions.get(actionName);
  //   if (!actionWithPredicate) {
  //     throw new Error(`Default action "${actionName}" does not exist.`);
  //   }
  //   this.unregister(actionWithPredicate.predicate, actionWithPredicate.action);
  // }
  // register(predicate: InputActionPredicate, actionOrActionName: InputActionOrInputActionName): void {
  //   const action =
  //     typeof actionOrActionName === 'string' ? this.defaultActions.get(actionOrActionName)?.action : actionOrActionName;
  //   if (!action) {
  //     throw new Error(`Action "${actionOrActionName}" not found among default actions.`);
  //   }
  //   this.registeredActions.push({ predicate, action });
  // }
  // unregister(predicate: InputActionPredicate, actionOrActionName: InputActionOrInputActionName): void {
  //   this.registeredActions = this.registeredActions.filter(
  //     (handler) =>
  //       handler.predicate !== predicate ||
  //       handler.action !==
  //         (typeof actionOrActionName === 'string'
  //           ? this.defaultActions.get(actionOrActionName)?.action
  //           : actionOrActionName)
  //   );
  // }
  // invoke(actionName: InputActionName, event: Event): void {
  //   const action = this.defaultActions.get(actionName)?.action;
  //   if (!action) {
  //     throw new Error(`Default action "${actionName}" does not exist.`);
  //   }
  //   action(event, this.flowCore);
  // }
}
