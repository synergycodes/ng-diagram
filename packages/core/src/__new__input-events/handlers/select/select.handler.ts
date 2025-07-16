import { __new__withPrimaryModifier } from '../../../types/__old__event/event.guards';
import { __NEW__EventHandler } from '../event-hander';
import { __NEW__SelectEvent } from './select.event';

export class __NEW__SelectHandler extends __NEW__EventHandler<__NEW__SelectEvent> {
  handle(event: __NEW__SelectEvent): void {
    const targetElements = this.getTargetElements(event);
    if (!targetElements) {
      this.flow.commandHandler.emit('deselectAll');
      return;
    }

    const { target: clickedElement } = event;

    const isAlreadySelected = clickedElement?.selected;
    const isModifierPressed = __new__withPrimaryModifier(event);
    if (isAlreadySelected && isModifierPressed) {
      this.flow.commandHandler.emit('deselect', targetElements);
      return;
    }
    this.flow.commandHandler.emit('select', {
      ...targetElements,
      preserveSelection: isAlreadySelected || isModifierPressed,
    });
  }

  private getTargetElements(event: __NEW__SelectEvent) {
    if (event.targetType === 'diagram' || !event.target) {
      return null;
    } else if (event.targetType === 'node') {
      return { nodeIds: [event.target.id], edgeIds: undefined };
    } else if (event.targetType === 'edge') {
      return { nodeIds: undefined, edgeIds: [event.target.id] };
    }
  }
}
