import { Injectable } from '@angular/core';

import type { BaseInputEvent, FlowCore, Point, ShortcutDefinition, Viewport } from '../../../../../core/src';
import type { KeyboardAction } from './keyboard-action.interface';

/**
 * Handles zoom keyboard shortcut with viewport position and step taken into consideration
 *
 * This action:
 * - Only handles 'keyboardZoomIn' and 'keyboardZoomOut' action
 * - Enriches zoom events with centerPoint being viewport center position and zoomFactor calculated based on config step
 *
 * @category Services
 */
@Injectable()
export class ZoomAction implements KeyboardAction {
  canHandle(shortcut: ShortcutDefinition): boolean {
    return shortcut.actionName === 'keyboardZoomIn' || shortcut.actionName === 'keyboardZoomOut';
  }

  createEvent(
    shortcut: ShortcutDefinition,
    baseEvent: Omit<BaseInputEvent, 'name'>,
    flowCore: FlowCore
  ): BaseInputEvent | null {
    const step = flowCore.config.zoom.step;
    const centerPoint = this.getCenterPoint(flowCore.getViewport());
    const direction = this.extractDirection(shortcut.actionName);

    if (!direction || !centerPoint) {
      return null;
    }

    const zoomFactor = direction > 0 ? 1 + step : 1 - step;

    return {
      ...baseEvent,
      name: 'zoom',
      centerPoint,
      zoomFactor,
    } as BaseInputEvent;
  }

  private extractDirection(actionName: string): 1 | -1 | null {
    if (actionName.endsWith('In')) return 1;
    if (actionName.endsWith('Out')) return -1;
    return null;
  }

  private getCenterPoint(viewport: Viewport): Point | undefined {
    if (!viewport.width || !viewport.height) {
      return;
    }

    return {
      x: viewport.width / 2,
      y: viewport.height / 2,
    };
  }
}
