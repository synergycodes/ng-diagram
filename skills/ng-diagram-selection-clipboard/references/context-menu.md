# Context menu: full wiring (ng-diagram 1.4.0)

A node menu (copy, cut, delete) and a canvas menu (paste here, select all) for ng-diagram. Based on the docs "Context Menu" example, with the paste position stored when the menu opens.

Pieces:
1. `ContextMenuState` — a small app service that holds the open menu. Provide it next to `provideNgDiagram()` so node templates and the menu share one instance.
2. The node template opens the node menu on `contextmenu` and selects the node, because a right-click does not select.
3. A wrapper around `<ng-diagram>` opens the canvas menu. It is `position: relative`, so the menu can be placed with `clientToFlowViewportPosition` (pixels from the diagram's top-left corner; the diagram fills the wrapper from its top-left).
4. The menu component runs the actions and closes on the next document click.

```ts
import { Component, inject, Injectable, input, signal } from '@angular/core';
import {
  NgDiagramClipboardService,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  initializeModel,
  provideNgDiagram,
  type NgDiagramNodeTemplate,
  type Node,
  type Point,
} from 'ng-diagram';

export interface MenuState {
  x: number; // px from the diagram's top-left corner, for the menu element
  y: number;
  flow: Point; // where to paste
  onNode: boolean;
}

@Injectable()
export class ContextMenuState {
  readonly menu = signal<MenuState | null>(null);
  private readonly viewportService = inject(NgDiagramViewportService);

  open(event: MouseEvent, onNode: boolean) {
    event.preventDefault(); // no browser menu
    const client = { x: event.clientX, y: event.clientY };
    this.menu.set({
      ...this.viewportService.clientToFlowViewportPosition(client), // relative to <ng-diagram>'s top-left
      flow: this.viewportService.clientToFlowPosition(client), // diagram coordinates
      onNode,
    });
  }
}

@Component({
  selector: 'app-task-node',
  host: { '(contextmenu)': 'openMenu($event)' },
  template: `{{ node().data.label }}`,
})
export class TaskNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  readonly node = input.required<Node<{ label: string }>>();
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly menuState = inject(ContextMenuState);

  openMenu(event: MouseEvent) {
    event.stopPropagation(); // keep the canvas menu handler out
    this.menuState.open(event, true); // calls preventDefault(), so keep it before any await
    if (!this.node().selected) {
      void this.selectionService.select([this.node().id]); // right-click does not select by itself
    }
  }
}

@Component({
  selector: 'app-context-menu',
  host: { '(document:click)': 'close()' },
  template: `
    @if (menuState.menu(); as menu) {
      <ul class="menu" [style.left.px]="menu.x" [style.top.px]="menu.y">
        @if (menu.onNode) {
          <li (click)="copy()">Copy</li>
          <li (click)="cut()">Cut</li>
          <li (click)="remove()">Delete</li>
        } @else {
          <li (click)="paste(menu.flow)">Paste here</li>
          <li (click)="selectAll()">Select all</li>
        }
      </ul>
    }
  `,
  styles: `.menu { position: absolute; z-index: 10; margin: 0; }`,
})
export class ContextMenuComponent {
  readonly menuState = inject(ContextMenuState);
  private readonly clipboard = inject(NgDiagramClipboardService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);

  copy() {
    void this.clipboard.copy();
  }
  cut() {
    void this.clipboard.cut();
  }
  remove() {
    void this.selectionService.deleteSelection();
  }
  paste(at: Point) {
    void this.clipboard.paste(at);
  }
  selectAll() {
    const model = this.modelService.getModel();
    void this.selectionService.select(
      model.getNodes().filter((n) => !n.computedHidden).map((n) => n.id),
      model.getEdges().filter((e) => !e.computedHidden).map((e) => e.id)
    );
  }
  close() {
    this.menuState.menu.set(null);
  }
}

@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent, ContextMenuComponent],
  providers: [provideNgDiagram(), ContextMenuState],
  template: `
    <div class="editor" (contextmenu)="menuState.open($event, false)">
      <ng-diagram [model]="model" [nodeTemplateMap]="nodeTemplateMap" />
      <app-context-menu />
    </div>
  `,
  styles: `.editor { position: relative; height: 600px; display: flex; }`,
})
export class EditorComponent {
  readonly menuState = inject(ContextMenuState);
  nodeTemplateMap = new NgDiagramNodeTemplateMap([['task', TaskNodeComponent]]);
  model = initializeModel({
    nodes: [{ id: '1', type: 'task', position: { x: 100, y: 100 }, data: { label: 'Task' } }],
  });
}
```

Notes:
- `ContextMenuState` injects `NgDiagramViewportService`, so it must be provided where `provideNgDiagram()` is visible (here: the same `providers` array).
- The `(document:click)` close runs after the item's own `(click)`, because the click bubbles from the item up to the document. A right-click fires `contextmenu`, not `click`, so it does not close the menu it opens.
- For an edge menu, handle `contextmenu` in your custom edge template (see `ng-diagram-custom-edges`) and select the edge with `select([], [edge.id])`.
- Disable "Paste here" when there is nothing to paste: `NgDiagramService.actionState().copyPaste` is `undefined` before the first copy and `{ copiedNodes, copiedEdges }` after it (both arrays empty when nothing was selected).
