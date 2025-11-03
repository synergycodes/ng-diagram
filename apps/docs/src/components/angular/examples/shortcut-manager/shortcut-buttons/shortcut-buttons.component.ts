import { Component, inject, signal } from '@angular/core';
import { configureShortcuts, NgDiagramService } from 'ng-diagram';

@Component({
  imports: [],
  selector: 'shortcut-buttons',
  template: `
    <label class="checkbox-label">
      <input
        type="checkbox"
        [checked]="useCustomShortcut()"
        (change)="togglePasteShortcut()"
      />
      <span>Use Ctrl/Cmd + B for paste</span>
    </label>
  `,
  styleUrls: ['./shortcut-buttons.component.scss'],
})
export class ShortcutButtonsComponent {
  private readonly ngDiagramService = inject(NgDiagramService);
  protected readonly useCustomShortcut = signal(false);

  togglePasteShortcut(): void {
    this.useCustomShortcut.update((value) => !value);

    const updatedShortcuts = configureShortcuts([
      {
        actionName: 'paste',
        bindings: [
          {
            key: this.useCustomShortcut() ? 'b' : 'v',
            modifiers: { primary: true },
          },
        ],
      },
    ]);

    this.ngDiagramService.updateConfig({
      shortcuts: updatedShortcuts,
    });
  }
}
