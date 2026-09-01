import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NgDiagramViewportService } from '../../../public-services/ng-diagram-viewport.service';
import { EnvironmentProviderService } from '../../../services/environment-provider/environment-provider.service';
import { PaletteService } from '../../../services/palette/palette.service';
import { NgDiagramPaletteItem } from '../../../types';
import { NgDiagramPaletteItemPreviewComponent } from '../item-preview/ng-diagram-palette-item-preview.component';
import { NgDiagramPaletteItemComponent } from './ng-diagram-palette-item.component';

const ITEM: NgDiagramPaletteItem = { type: 'default', data: { label: 'Default' } };

@Component({
  standalone: true,
  imports: [NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent],
  template: `
    <ng-diagram-palette-item [item]="item">
      <span class="label">Node</span>
      <ng-diagram-palette-item-preview>
        <span class="content">Node preview</span>
      </ng-diagram-palette-item-preview>
    </ng-diagram-palette-item>
  `,
})
class HostWithPreviewComponent {
  item = ITEM;
}

@Component({
  standalone: true,
  imports: [NgDiagramPaletteItemComponent],
  template: `
    <ng-diagram-palette-item [item]="item">
      <span class="label">Node</span>
    </ng-diagram-palette-item>
  `,
})
class HostWithoutPreviewComponent {
  item = ITEM;
}

// jsdom implements neither DragEvent nor DataTransfer, so the handler gets the shape it reads.
function dragEvent(dataTransfer: { setDragImage?: unknown; setData?: unknown } | null): DragEvent {
  return { dataTransfer } as unknown as DragEvent;
}

function setup(host: typeof HostWithPreviewComponent | typeof HostWithoutPreviewComponent = HostWithPreviewComponent) {
  const paletteService = {
    onMouseDown: vi.fn(),
    onDragStartFromPalette: vi.fn(),
  };

  TestBed.configureTestingModule({
    imports: [host],
    providers: [
      { provide: PaletteService, useValue: paletteService },
      { provide: NgDiagramViewportService, useValue: { scale: signal(2) } },
      { provide: EnvironmentProviderService, useValue: { generateId: () => 'preview-id' } },
    ],
  });

  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();

  const component = fixture.debugElement.children[0].componentInstance as NgDiagramPaletteItemComponent;
  const draggable = fixture.nativeElement.querySelector('.draggable') as HTMLElement;

  return { fixture, component, draggable, paletteService };
}

function clonesInBody(): HTMLElement[] {
  return [...document.body.querySelectorAll(':scope > .dragged-node')] as HTMLElement[];
}

describe('NgDiagramPaletteItemComponent', () => {
  beforeEach(() => {
    for (const leftover of clonesInBody()) leftover.remove();
  });

  describe('drag image handling', () => {
    it('appends the clone to the document before handing it to setDragImage', () => {
      const { component } = setup();
      let connectedAtCall: boolean | null = null;
      const setDragImage = vi.fn((...args: [image: HTMLElement, x: number, y: number]) => {
        connectedAtCall = args[0].isConnected;
      });

      component.onDragStart(dragEvent({ setDragImage }));

      // The element must be in the document when the browser snapshots it, and the cursor sits at
      // its top-left corner.
      expect(connectedAtCall).toBe(true);
      expect(setDragImage).toHaveBeenCalledWith(expect.anything(), 0, 0);
    });

    it('hands over the scaled preview clone, not the rendered preview itself', () => {
      const { component, fixture } = setup();
      const rendered = fixture.nativeElement.querySelector('ng-diagram-palette-item-preview .content');
      let image: HTMLElement | null = null;

      component.onDragStart(dragEvent({ setDragImage: (i: HTMLElement) => (image = i) }));

      expect(image!.querySelector('.content')?.textContent).toBe('Node preview');
      expect(image!.contains(rendered)).toBe(false);
      expect(image!.style.zoom).toBe('2');
    });

    it('removes the clone from the document on the next frame', () => {
      const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
      const { component } = setup();

      component.onDragStart(dragEvent({ setDragImage: vi.fn() }));
      expect(clonesInBody()).toHaveLength(1);

      // Run the scheduled cleanup — without it every drag would leak a node into <body>.
      raf.mock.calls[0][0](0);

      expect(clonesInBody()).toHaveLength(0);
      raf.mockRestore();
    });

    it('does nothing when the event carries no dataTransfer', () => {
      const { component } = setup();

      expect(() => component.onDragStart(dragEvent(null))).not.toThrow();

      expect(clonesInBody()).toHaveLength(0);
    });

    it('does nothing when no preview is projected', () => {
      const { component } = setup(HostWithoutPreviewComponent);
      const setDragImage = vi.fn();

      expect(() => component.onDragStart(dragEvent({ setDragImage }))).not.toThrow();

      expect(setDragImage).not.toHaveBeenCalled();
      expect(clonesInBody()).toHaveLength(0);
    });
  });

  describe('palette service wiring', () => {
    it('forwards the dragged item on dragstart', () => {
      const { component, paletteService } = setup();
      const event = dragEvent({ setDragImage: vi.fn() });

      component.onDragStart(event);

      expect(paletteService.onDragStartFromPalette).toHaveBeenCalledWith(event, ITEM);
    });

    it('reports the item and its preview id on mousedown', () => {
      const { component, paletteService } = setup();

      component.onMouseDown();

      expect(paletteService.onMouseDown).toHaveBeenCalledWith(ITEM, 'preview-id');
    });

    it('reports an empty preview id when no preview is projected', () => {
      const { component, paletteService } = setup(HostWithoutPreviewComponent);

      component.onMouseDown();

      expect(paletteService.onMouseDown).toHaveBeenCalledWith(ITEM, '');
    });

    it('suppresses the default touch behaviour so the gesture is not treated as a scroll', () => {
      const { component, paletteService } = setup();
      const preventDefault = vi.fn();

      component.onTouchStart({ preventDefault } as unknown as TouchEvent);

      expect(preventDefault).toHaveBeenCalled();
      expect(paletteService.onMouseDown).toHaveBeenCalledWith(ITEM, 'preview-id');
    });
  });

  describe('template wiring', () => {
    it('starts the drag from the draggable element', () => {
      const { component, draggable } = setup();
      const onDragStart = vi.spyOn(component, 'onDragStart').mockReturnValue(undefined);

      draggable.dispatchEvent(new Event('dragstart'));

      expect(onDragStart).toHaveBeenCalled();
      expect(draggable.getAttribute('draggable')).toBe('true');
    });
  });
});
