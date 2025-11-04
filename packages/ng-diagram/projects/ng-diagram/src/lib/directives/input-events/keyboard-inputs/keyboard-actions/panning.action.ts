import { Injectable } from '@angular/core';
import type { BaseInputEvent, Direction, FlowCore, ShortcutDefinition } from '../../../../../core/src';
import type { KeyboardAction } from './keyboard-action.interface';

/**
 * Handles keyboard shortcuts for panning the viewport
 *
 * This action:
 * - Only activates when NO nodes are selected
 * - Extracts direction from action name (keyboardPanUp → 'top')
 * - Emits 'keyboardPanning' event with direction data
 *
 * @category Services
 */
@Injectable()
export class PanningAction implements KeyboardAction {
  canHandle(shortcut: ShortcutDefinition, flowCore: FlowCore): boolean {
    return shortcut.actionName.startsWith('keyboardPan') && flowCore.modelLookup.getSelectedNodes().length === 0;
  }

  createEvent(shortcut: ShortcutDefinition, baseEvent: Omit<BaseInputEvent, 'name'>): BaseInputEvent | null {
    const direction = this.extractDirection(shortcut.actionName);
    if (!direction) {
      return null;
    }

    return {
      ...baseEvent,
      name: 'keyboardPanning',
      direction,
    } as BaseInputEvent;
  }

  private extractDirection(actionName: string): Direction | null {
    if (actionName.endsWith('Up')) return 'bottom';
    if (actionName.endsWith('Down')) return 'top';
    if (actionName.endsWith('Left')) return 'right';
    if (actionName.endsWith('Right')) return 'left';
    return null;
  }
}
