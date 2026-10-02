import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
function dragEvent(
  dataTransfer: { setDragImage?: unknown; setData?: unknown } | null,
  target?: EventTarget
): DragEvent {
  return { dataTransfer, target } as unknown as DragEvent;
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
      { provide: EnvironmentProviderService, useValue: { generateId: () => 'preview-id', browser: 'Chrome' } },
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
    // jsdom has no CSS object; the clone path under test is the CSS-zoom one.
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // A test that fails mid-way must not leave window.requestAnimationFrame (or any other spy)
    // stubbed for the rest of the file.
    vi.restoreAllMocks();
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
      const { component } = setup();
      const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

      component.onDragStart(dragEvent({ setDragImage: vi.fn() }));
      expect(clonesInBody()).toHaveLength(1);

      // Run every scheduled callback — the component's cleanup is among them, wherever any
      // framework-scheduled frame requests land.
      for (const call of raf.mock.calls) call[0](0);

      expect(clonesInBody()).toHaveLength(0);
    });

    it('removes the clone on dragend even when no frame runs (occluded tab)', () => {
      const { component, draggable } = setup();
      vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);

      component.onDragStart(dragEvent({ setDragImage: vi.fn() }, draggable));
      expect(clonesInBody()).toHaveLength(1);

      draggable.dispatchEvent(new Event('dragend'));

      expect(clonesInBody()).toHaveLength(0);
    });

    it('removes the clone immediately when setDragImage throws', () => {
      const { component, paletteService } = setup();
      const setDragImage = vi.fn(() => {
        throw new Error('wrapped DataTransfer');
      });

      expect(() => component.onDragStart(dragEvent({ setDragImage }))).not.toThrow();

      expect(clonesInBody()).toHaveLength(0);
      // The drag itself must still be armed.
      expect(paletteService.onDragStartFromPalette).toHaveBeenCalled();
    });

    it('does nothing when the event carries no dataTransfer', () => {
      const { component, fixture } = setup();
      const preview = fixture.debugElement.query(By.directive(NgDiagramPaletteItemPreviewComponent))
        .componentInstance as NgDiagramPaletteItemPreviewComponent;
      const createDragImage = vi.spyOn(preview, 'createDragImage');

      expect(() => component.onDragStart(dragEvent(null))).not.toThrow();

      // Without a dataTransfer there is nothing to hand the image to — no clone is even built.
      expect(createDragImage).not.toHaveBeenCalled();
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

    // These bindings are the only thing arming the touch drag-and-drop path (they set
    // PaletteService.draggedNode) — losing one silently amputates that path.
    it('arms the drag on a real mousedown', () => {
      const { draggable, paletteService } = setup();

      draggable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

      expect(paletteService.onMouseDown).toHaveBeenCalledWith(ITEM, 'preview-id');
    });

    it('arms the drag on a real touchstart and suppresses the scroll', () => {
      const { draggable, paletteService } = setup();
      const touchStart = new Event('touchstart', { bubbles: true, cancelable: true });

      draggable.dispatchEvent(touchStart);

      expect(paletteService.onMouseDown).toHaveBeenCalledWith(ITEM, 'preview-id');
      expect(touchStart.defaultPrevented).toBe(true);
    });
  });
});
