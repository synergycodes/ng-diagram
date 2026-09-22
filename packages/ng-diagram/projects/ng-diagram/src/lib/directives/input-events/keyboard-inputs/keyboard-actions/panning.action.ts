import { Injectable } from '@angular/core';
import type { BaseInputEvent, Direction, FlowCore, ShortcutDefinition } from '../../../../../core/src';
import { hasMovableSelection } from '../../../../../core/src/input-events/handlers/movable-selection';
import type { KeyboardAction } from './keyboard-action.interface';

/**
 * Handles keyboard shortcuts for panning the viewport
 *
 * This action:
 * - Only activates when the arrow keys would not move the selection (see `hasMovableSelection`)
 * - Extracts direction from action name (keyboardPanUp → 'top')
 * - Emits 'keyboardPanning' event with direction data
 *
 * @category Services
 */
@Injectable()
export class PanningAction implements KeyboardAction {
  canHandle(shortcut: ShortcutDefinition, flowCore: FlowCore): boolean {
    // Exact opposite of the MovingAction check: when nothing would move (node
    // dragging disabled, or only hidden or `draggable: false` nodes selected),
    // the arrow keys pan instead.
    return (
      flowCore.config.viewportPanningEnabled &&
      shortcut.actionName.startsWith('keyboardPan') &&
      !hasMovableSelection(flowCore)
    );
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
