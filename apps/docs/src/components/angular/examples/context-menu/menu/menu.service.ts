import { Injectable, signal } from '@angular/core';
import type { Point } from 'ng-diagram';

@Injectable()
export class ContextMenuService {
  readonly visibility = signal(false);
  readonly menuPosition = signal({ x: 0, y: 0 });
  readonly nodeContext = signal(false);

  showMenu({ x, y }: Point): void {
    this.nodeContext.set(true);
    this.menuPosition.set({ x, y });
    this.visibility.set(true);
  }

  showDiagramMenu({ x, y }: Point): void {
    this.nodeContext.set(false);
    this.menuPosition.set({ x, y });
    this.visibility.set(true);
  }

  hideMenu(): void {
    this.visibility.set(false);
  }
}
