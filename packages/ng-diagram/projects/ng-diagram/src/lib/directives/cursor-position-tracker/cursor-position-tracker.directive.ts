import { Directive, inject } from '@angular/core';
import { CursorPositionTrackerService } from '../../services/cursor-position-tracker/cursor-position-tracker.service';

@Directive({
  selector: '[ngDiagramCursorPositionTracker]',
  standalone: true,
  host: {
    '(document:mousemove)': 'onMouseMove($event)',
  },
})
export class CursorPositionTrackerDirective {
  private readonly cursorPositionService = inject(CursorPositionTrackerService);

  onMouseMove(event: MouseEvent): void {
    this.cursorPositionService.updatePosition(event.clientX, event.clientY);
  }
}
