# Palette recipes (ng-diagram 1.4.0)

Longer recipes for the `ng-diagram-palette` skill.

- [Categorized, searchable palette](#categorized-searchable-palette)
- [Reuse your node template as the preview](#reuse-your-node-template-as-the-preview)
- [Custom drag source](#custom-drag-source)
- [Block file drops](#block-file-drops)

## Categorized, searchable palette

Keep categories outside the item `data`: everything in `data` is copied into the dropped node.

```ts
import { Component, computed, input, signal } from '@angular/core';
import {
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  type NgDiagramPaletteItem,
} from 'ng-diagram';

export interface PaletteCategory {
  name: string;
  items: NgDiagramPaletteItem[];
}

@Component({
  selector: 'app-search-palette',
  imports: [NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent],
  template: `
    <input placeholder="Search" [value]="query()" (input)="query.set($any($event.target).value)" />
    @for (category of visible(); track category.name) {
      <h4>{{ category.name }}</h4>
      @for (item of category.items; track item.data.label) {
        <ng-diagram-palette-item [item]="item">
          <div class="palette-card">{{ item.data.label }}</div>
          <ng-diagram-palette-item-preview>
            <div class="node-look">{{ item.data.label }}</div>
          </ng-diagram-palette-item-preview>
        </ng-diagram-palette-item>
      }
    } @empty {
      <p>No match</p>
    }
  `,
})
export class SearchPaletteComponent {
  categories = input.required<PaletteCategory[]>();
  query = signal('');

  visible = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.categories()
      .map((category) => ({
        name: category.name,
        items: category.items.filter((item) => item.data.label.toLowerCase().includes(q)),
      }))
      .filter((category) => category.items.length > 0);
  });
}
```

## Reuse your node template as the preview

A node template expects a `node` input, so give it a node-shaped object built from the item. Build it in a `computed`, not in a template method call, so the preview does not get a new object on every change detection. The node wrapper that applies `size` on the canvas does not exist in the palette, so set the size on a wrapper `div`.

```ts
import { Component, computed, input } from '@angular/core';
import {
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  type BasePaletteItemData,
  type NgDiagramNodeTemplate,
  type NgDiagramPaletteItem,
  type SimpleNode,
} from 'ng-diagram';

export interface TaskData extends BasePaletteItemData {
  owner: string;
}

// The same component is registered in the diagram's nodeTemplateMap under 'task'.
@Component({
  selector: 'app-task-node',
  template: `<div class="task">{{ node().data.label }} · {{ node().data.owner }}</div>`,
})
export class TaskNodeComponent implements NgDiagramNodeTemplate<TaskData> {
  node = input.required<SimpleNode<TaskData>>();
}

@Component({
  selector: 'app-task-palette',
  imports: [NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent, TaskNodeComponent],
  template: `
    @for (entry of entries(); track entry.node.id) {
      <ng-diagram-palette-item [item]="entry.item">
        <div class="palette-card">{{ entry.item.data.label }}</div>
        <ng-diagram-palette-item-preview>
          <div [style.width.px]="entry.item.size?.width" [style.height.px]="entry.item.size?.height">
            <app-task-node [node]="entry.node" />
          </div>
        </ng-diagram-palette-item-preview>
      </ng-diagram-palette-item>
    }
  `,
})
export class TaskPaletteComponent {
  items = input.required<NgDiagramPaletteItem<TaskData>[]>();

  // A node-shaped stand-in per item, built once per items change (not on every change detection).
  entries = computed(() =>
    this.items().map((item, index) => {
      const node: SimpleNode<TaskData> = {
        id: `palette-preview-${index}`,
        position: { x: 0, y: 0 },
        type: item.type,
        data: item.data,
      };
      return { item, node };
    })
  );
}
```

Parts of the template that need the canvas render nothing here: `ng-diagram-port` and the resize/rotate adornments stay hidden. `[ngDiagramHidden]` outside the diagram logs a console warning and is ignored. `NgDiagramPaletteItem<TaskData>` fits the `[item]` input only because `TaskData` extends `BasePaletteItemData`.

## Custom drag source

The diagram reads a dropped item from the drag data: JSON text in the `text/plain` format. The library's own "Failed to parse palette drop data" message describes this channel for custom implementations. So any `draggable` element that sets this data creates a node on drop, even outside the `provideNgDiagram()` scope (for example, in an app shell that cannot move under the diagram's providers).

```ts
import { Component, input } from '@angular/core';
import type { NgDiagramPaletteItem } from 'ng-diagram';

@Component({
  selector: 'app-shell-item',
  template: `<div draggable="true" (dragstart)="onDragStart($event)">{{ item().data.label }}</div>`,
})
export class ShellItemComponent {
  item = input.required<NgDiagramPaletteItem>();

  onDragStart(event: DragEvent) {
    // The diagram reads the dropped item from this exact channel: JSON in 'text/plain'.
    event.dataTransfer?.setData('text/plain', JSON.stringify(this.item()));
  }
}
```

Limits compared with `ng-diagram-palette-item`: no zoom-scaled drag image (set your own with `event.dataTransfer.setDragImage`), and the library's touch drop does not work, because it only tracks touches that start on `ng-diagram-palette-item`. The drop itself behaves the same: new id from `computeNodeId`, top-left corner at the pointer, snapping, `paletteItemDropped`.

## Block file drops

`<ng-diagram>` accepts every HTML5 drop. A drop without text, such as a file from the desktop, creates a node with no `data`, and a template that reads `node().data` then fails. Stop such drops in the capture phase on an element that wraps the diagram, before the diagram's own handler runs:

```ts
import { Directive, ElementRef, inject, type OnDestroy } from '@angular/core';

@Directive({ selector: '[appPaletteOnlyDrops]' })
export class PaletteOnlyDropsDirective implements OnDestroy {
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;

  // Capture phase: runs before the drop handler of the <ng-diagram> inside this element.
  private readonly onDrop = (event: DragEvent) => {
    if (!event.dataTransfer?.getData('text/plain')) {
      event.preventDefault(); // keeps the browser from opening a dropped file
      event.stopPropagation();
    }
  };

  constructor() {
    this.host.addEventListener('drop', this.onDrop, true);
  }

  ngOnDestroy() {
    this.host.removeEventListener('drop', this.onDrop, true);
  }
}
```

Use it on the wrapper: `<div class="canvas" appPaletteOnlyDrops><ng-diagram [model]="model" /></div>`. Drops of palette items (JSON text) pass through. Touch drops from `ng-diagram-palette-item` do not use `drop` events, so they are not affected.
