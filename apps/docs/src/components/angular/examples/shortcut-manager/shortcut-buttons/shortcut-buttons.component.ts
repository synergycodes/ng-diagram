import { Component, inject } from '@angular/core';
import { configureShortcuts, NgDiagramService } from 'ng-diagram';

@Component({
  imports: [],
  selector: 'shortcut-buttons',
  template: `
    <button class="btn" (click)="updatePasteShortcut()">
      Update paste shortcut to Ctrl/Cmd + B
    </button>
  `,
  styleUrls: ['./shortcut-buttons.component.scss'],
})
export class ShortcutButtonsComponent {
  private readonly ngDiagramService = inject(NgDiagramService);

  updatePasteShortcut(): void {
    // Update paste shortcut to Ctrl/Cmd + B
    const updatedShortcuts = configureShortcuts([
      // Update paste to Ctrl/Cmd + B
      {
        actionName: 'paste',
        bindings: [{ key: 'b', modifiers: { primary: true } }],
      },
    ]);

    this.ngDiagramService.updateConfig({
      shortcuts: updatedShortcuts,
    });
  }
}
