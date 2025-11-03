import { Component, inject } from '@angular/core';
import { configureShortcuts, NgDiagramService } from 'ng-diagram';

@Component({
  imports: [],
  selector: 'shortcut-buttons',
  template: `
    <button class="btn" (click)="updatePasteShortcut()">
      Update paste shortcut to Ctrl/Cmd + I
    </button>
  `,
  styleUrls: ['./shortcut-buttons.component.scss'],
})
export class ShortcutButtonsComponent {
  private readonly ngDiagramService = inject(NgDiagramService);

  updatePasteShortcut(): void {
    // Update paste shortcut to Ctrl/Cmd + I
    const updatedShortcuts = configureShortcuts([
      // Update paste to Ctrl/Cmd + I
      {
        actionName: 'paste',
        bindings: [{ key: 'i', modifiers: { primary: true } }],
      },
    ]);

    this.ngDiagramService.updateConfig({
      shortcuts: updatedShortcuts,
    });
  }
}
