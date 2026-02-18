import type { BaseInputEvent, FlowCore, ShortcutDefinition } from '../../../../../core/src';

export interface KeyboardAction {
  canHandle(shortcut: ShortcutDefinition, flowCore: FlowCore): boolean;
  createEvent(
    shortcut: ShortcutDefinition,
    baseEvent: Omit<BaseInputEvent, 'name'>,
    flowCore: FlowCore
  ): BaseInputEvent | null;
}
