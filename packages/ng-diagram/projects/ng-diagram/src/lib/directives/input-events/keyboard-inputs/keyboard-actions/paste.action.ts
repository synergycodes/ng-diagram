import { inject, Injectable } from '@angular/core';

import type { BaseInputEvent, BasePointerInputEvent, ShortcutDefinition } from '../../../../../core/src';
import { CursorPositionTrackerService } from '../../../../services/cursor-position-tracker/cursor-position-tracker.service';
import type { KeyboardAction } from './keyboard-action.interface';

/**
 * Handles paste keyboard shortcut with cursor position enrichment
 *
 * This action:
 * - Only handles 'paste' action
 * - Enriches paste events with cursor position when available
 *
 * @category Services
 */
@Injectable()
export class PasteAction implements KeyboardAction {
  private readonly cursorPositionTracker = inject(CursorPositionTrackerService);

  canHandle(shortcut: ShortcutDefinition): boolean {
    return shortcut.actionName === 'paste';
  }

  createEvent(shortcut: ShortcutDefinition, baseEvent: Omit<BaseInputEvent, 'name'>): BaseInputEvent | null {
    const event = {
      ...baseEvent,
      name: shortcut.actionName,
    } as BasePointerInputEvent;

    if (this.cursorPositionTracker.hasRecentPosition()) {
      event.lastInputPoint = this.cursorPositionTracker.getLastPosition();
    }

    return event;
  }
}
