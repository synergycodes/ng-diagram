import { FlowCore } from '../flow-core';
import { __NEW__InputEvent } from './events';

export type __NEW__InputAction = (event: __NEW__InputEvent, flowCore: FlowCore) => void;
export type __NEW__InputActionPredicate = (event: __NEW__InputEvent, flowCore: FlowCore) => boolean;

export interface __NEW__InputActionHandler {
  action: __NEW__InputAction;
  predicate: __NEW__InputActionPredicate;
}
