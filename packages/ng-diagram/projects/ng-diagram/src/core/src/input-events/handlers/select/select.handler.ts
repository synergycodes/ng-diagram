import { EventHandler } from '../event-handler';
import { SelectEvent } from './select.event';

export class SelectEventHandler extends EventHandler<SelectEvent> {
  handle(event: SelectEvent): void {
    const targetElements = this.getTargetElements(event);
    const isModifierPressed = this.flow.shortcutManager.matchesAction('preserveSelection', {
      modifiers: event.modifiers,
    });

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

  private getTargetElements(event: SelectEvent) {
    if (event.targetType === 'diagram' || !event.target) {
      return null;
    } else if (event.targetType === 'node') {
      return { nodeIds: [event.target.id], edgeIds: undefined };
    } else if (event.targetType === 'edge') {
      return { nodeIds: undefined, edgeIds: [event.target.id] };
    }
  }
}
