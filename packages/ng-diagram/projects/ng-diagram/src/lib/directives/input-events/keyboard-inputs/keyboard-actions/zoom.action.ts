import { Injectable } from '@angular/core';

import type { BaseInputEvent, FlowCore, Point, ShortcutDefinition, Viewport } from '../../../../../core/src';
import type { KeyboardAction } from './keyboard-action.interface';

/**
 * Handles zoom keyboard shortcut with viewport position and step taken into consideration
 *
 * This action:
 * - Only handles 'zoom' action
 * - Enriches zoom events with centerPoint being viewport center position and zoomFactor calculated based on config step
 *
 * @category Services
 */
@Injectable()
export class ZoomAction implements KeyboardAction {
  private step = 0;
  private centerPoint: Point | undefined;

  canHandle(shortcut: ShortcutDefinition, flowCore: FlowCore): boolean {
    this.step = flowCore.config.zoom.step;
    this.centerPoint = this.getCenterPoint(flowCore.getViewport());

    return shortcut.actionName === 'zoomIn' || shortcut.actionName === 'zoomOut';
  }

  createEvent(shortcut: ShortcutDefinition, baseEvent: Omit<BaseInputEvent, 'name'>): BaseInputEvent | null {
    const direction = this.extractDirection(shortcut.actionName);
    if (!direction || !this.centerPoint) {
      return null;
    }
    const zoomFactor = direction > 0 ? 1 - this.step : 1 + this.step;

    return {
      ...baseEvent,
      name: 'zoom',
      centerPoint: this.centerPoint,
      zoomFactor,
    } as BaseInputEvent;
  }

  private extractDirection(actionName: string): 1 | -1 | null {
    if (actionName.endsWith('In')) return -1;
    if (actionName.endsWith('Out')) return 1;
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
