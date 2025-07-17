import { __new__withPrimaryModifier } from '../../../types/__old__event/event.guards';
import { __NEW__EventHandler } from '../event-hander';
import { __NEW__NEW__SelectEvent } from './select.event';

export class __NEW__SelectEventHandler extends __NEW__EventHandler<__NEW__NEW__SelectEvent> {
  handle(event: __NEW__NEW__SelectEvent): void {
    const targetElements = this.getTargetElements(event);
    const isModifierPressed = __new__withPrimaryModifier(event);

    if (!targetElements && !isModifierPressed) {
      this.flow.commandHandler.emit('deselectAll');
      return;
    }

    if (!targetElements) {
      return;
    }

    const { target: clickedElement } = event;

    const isAlreadySelected = clickedElement?.selected;
    if (isAlreadySelected && isModifierPressed) {
      this.flow.commandHandler.emit('deselect', targetElements);
      return;
    }
    this.flow.commandHandler.emit('select', {
      ...targetElements,
      preserveSelection: isAlreadySelected || isModifierPressed,
    });
  }

  private getTargetElements(event: __NEW__NEW__SelectEvent) {
    if (event.targetType === 'diagram' || !event.target) {
      return null;
    } else if (event.targetType === 'node') {
      return { nodeIds: [event.target.id], edgeIds: undefined };
    } else if (event.targetType === 'edge') {
      return { nodeIds: undefined, edgeIds: [event.target.id] };
    }
  }
}
