import { Injectable } from '@angular/core';
import { Point } from '../../../core/src';

export interface CursorPosition extends Point {
  timestamp: number;
}

@Injectable()
export class CursorPositionTrackerService {
  private _lastPosition: CursorPosition = { x: 0, y: 0, timestamp: 0 };

  /**
   * Update the cursor position
   * @param x Client X coordinate
   * @param y Client Y coordinate
   */
  updatePosition(x: number, y: number): void {
    this._lastPosition = {
      x,
      y,
      timestamp: Date.now(),
    };
  }

  /**
   * Get the last known cursor position
   * @returns Latest cursor position
   */
  getLastPosition(): CursorPosition {
    return { ...this._lastPosition };
  }

  /**
   * Check if we have a recent cursor position (within last 5 seconds)
   * @returns True if position is recent
   */
  hasRecentPosition(): boolean {
    const now = Date.now();
    return now - this._lastPosition.timestamp < 5000;
  }
}
