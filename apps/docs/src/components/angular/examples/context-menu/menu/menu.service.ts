import { Injectable, signal } from '@angular/core';

@Injectable()
export class ContextMenuService {
  readonly visibility = signal(false);
  readonly menuPosition = signal({ x: 0, y: 0 });
  readonly nodeContext = signal(false);

  showMenu({ x, y }: { x: number; y: number }): void {
    this.nodeContext.set(true);
    this.menuPosition.set({ x, y });
    this.visibility.set(true);
  }

  showDiagramMenu({ x, y }: { x: number; y: number }): void {
    this.nodeContext.set(false);
    this.menuPosition.set({ x, y });
    this.visibility.set(true);
  }

  hideMenu(): void {
    this.visibility.set(false);
  }
}
