import { Injectable } from '@angular/core';

import { BaseInputEvent, Direction, FlowCore, ShortcutDefinition } from '../../../../../core/src';
import type { KeyboardAction } from './keyboard-action.interface';

/**
 * Handles keyboard shortcuts for moving selected nodes
 *
 * This action:
 * - Only activates when nodes are selected
 * - Extracts direction from action name (keyboardMoveSelectionUp → 'top')
 * - Emits 'keyboardMoveSelection' event with direction data
 *
 * @category Services
 */
@Injectable()
export class MovingAction implements KeyboardAction {
  canHandle(shortcut: ShortcutDefinition, flowCore: FlowCore): boolean {
    return (
      flowCore.config.nodeDraggingEnabled &&
      shortcut.actionName.startsWith('keyboardMoveSelection') &&
      flowCore.modelLookup.getSelectedNodes().length > 0
    );
  }

  createEvent(shortcut: ShortcutDefinition, baseEvent: Omit<BaseInputEvent, 'name'>): BaseInputEvent | null {
    const direction = this.extractDirection(shortcut.actionName);
    if (!direction) {
      return null;
    }

    return {
      ...baseEvent,
      name: 'keyboardMoveSelection',
      direction,
    } as BaseInputEvent;
  }

  private extractDirection(actionName: string): Direction | null {
    if (actionName.endsWith('Up')) return 'top';
    if (actionName.endsWith('Down')) return 'bottom';
    if (actionName.endsWith('Left')) return 'left';
    if (actionName.endsWith('Right')) return 'right';
    return null;
  }
}
