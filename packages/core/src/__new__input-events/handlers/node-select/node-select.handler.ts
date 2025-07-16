import { __new__withPrimaryModifier } from '../../../types';
import { __NEW__EventHandler } from '../event-hander';
import { NodeSelectEvent } from './node-select.event';

export class NodeSelectHandler extends __NEW__EventHandler<NodeSelectEvent> {
  handle(event: NodeSelectEvent): void {
    const { target: clickedElement } = event;

    if (!clickedElement) {
      this.flow.commandHandler.emit('deselectAll');
      return;
    }

    const isAlreadySelected = clickedElement?.selected;
    const isModifierPressed = __new__withPrimaryModifier(event);

    if (isAlreadySelected && isModifierPressed) {
      this.flow.commandHandler.emit('deselect', {
        nodeIds: [clickedElement.id],
      });
      return;
    }

    this.flow.commandHandler.emit('select', {
      nodeIds: [clickedElement.id],
      preserveSelection: isAlreadySelected || isModifierPressed,
    });
  }
}
