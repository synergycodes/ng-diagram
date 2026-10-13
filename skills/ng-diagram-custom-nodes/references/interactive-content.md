# Interactive content in node templates — full recipes

Two complete node templates: one with plain form controls (input, scrollable list, button) and one with Angular Material. Both are type-checked against ng-diagram 1.4.0. The rules behind them are in the main SKILL.md ("Inputs, buttons and scrollable content").

## Form controls, a scrollable list and a button

```typescript
import { Component, inject, input } from '@angular/core';
import {
  NgDiagramModelService, NgDiagramNodeSelectedDirective, NgDiagramPortComponent,
  type NgDiagramNodeTemplate, type Node,
} from 'ng-diagram';

interface NoteData {
  title: string;
  items: string[];
}

@Component({
  selector: 'app-note-node',
  imports: [NgDiagramPortComponent],
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  styles: `
    :host { display: flex; flex-direction: column; width: 100%; height: 100%; }
    ul { max-height: 120px; overflow: auto; }
  `,
  template: `
    <!-- typing or selecting text does not drag the node or pan the canvas -->
    <input [value]="node().data.title" (change)="rename($event)" data-no-drag="true" data-no-pan="true" />

    <!-- the wheel scrolls the list instead of panning the canvas; pressing the list does not drag the node -->
    <ul data-no-pan="true" data-no-drag="true">
      @for (item of node().data.items; track $index) {
        <li>{{ item }}</li>
      }
    </ul>

    <!-- pressing the button neither selects nor drags the node -->
    <button type="button" (pointerdown)="$event.stopPropagation()" (click)="addItem()">
      <svg viewBox="0 0 12 12" width="12" height="12"><path d="M6 1v10M1 6h10" stroke="currentColor" /></svg>
    </button>

    <ng-diagram-port id="out" type="source" side="right" />
  `,
})
export class NoteNodeComponent implements NgDiagramNodeTemplate<NoteData> {
  private readonly modelService = inject(NgDiagramModelService);
  node = input.required<Node<NoteData>>();

  rename(event: Event): void {
    const title = (event.target as HTMLInputElement).value;
    // updateNodeData replaces the whole data object, so keep the other fields
    void this.modelService.updateNodeData<NoteData>(this.node().id, { ...this.node().data, title });
  }

  addItem(): void {
    const data = this.node().data;
    void this.modelService.updateNodeData<NoteData>(this.node().id, { ...data, items: [...data.items, 'New item'] });
  }
}
```

## Angular Material select

Based on the docs example `angular-material-node`. The `keydown` handler keeps the arrow keys and Delete/Backspace in the select: diagram shortcuts skip only `input`, `textarea`, `select` and `contenteditable` elements, so without it the arrow keys in a focused `mat-select` also move the selected node.

```typescript
import { Component, inject, input } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule, type MatSelectChange } from '@angular/material/select';
import {
  NgDiagramModelService, NgDiagramNodeSelectedDirective, type NgDiagramNodeTemplate, type Node,
} from 'ng-diagram';

interface StatusData {
  name: string;
  status: 'Active' | 'Inactive' | 'Error';
}

// Default ng-diagram shortcut keys that a focused select also uses.
const WIDGET_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Delete', 'Backspace'];

@Component({
  selector: 'app-material-node',
  imports: [MatFormFieldModule, MatSelectModule],
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  styles: `:host { display: flex; flex-direction: column; width: 100%; height: 100%; }`,
  template: `
    <span>{{ node().data.name }}</span>
    <mat-form-field data-no-drag="true" data-no-pan="true" (keydown)="keepWidgetKeys($event)">
      <mat-select [value]="node().data.status" (selectionChange)="setStatus($event)">
        <mat-option value="Active">Active</mat-option>
        <mat-option value="Inactive">Inactive</mat-option>
        <mat-option value="Error">Error</mat-option>
      </mat-select>
    </mat-form-field>
  `,
})
export class MaterialNodeComponent implements NgDiagramNodeTemplate<StatusData> {
  private readonly modelService = inject(NgDiagramModelService);
  node = input.required<Node<StatusData>>();

  setStatus({ value }: MatSelectChange): void {
    void this.modelService.updateNodeData<StatusData>(this.node().id, { ...this.node().data, status: value });
  }

  // Without this, arrow keys in the focused select also move the selected node.
  keepWidgetKeys(event: KeyboardEvent): void {
    if (WIDGET_KEYS.includes(event.key)) {
      event.stopPropagation();
    }
  }
}
```

If you changed the shortcut bindings with `configureShortcuts`, add your own keys to the list (see `ng-diagram-shortcuts`).
