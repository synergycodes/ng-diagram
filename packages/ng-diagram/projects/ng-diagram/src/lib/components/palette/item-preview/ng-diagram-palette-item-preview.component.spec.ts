import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NgDiagramViewportService } from '../../../public-services/ng-diagram-viewport.service';
import { EnvironmentProviderService } from '../../../services/environment-provider/environment-provider.service';
import { PaletteService } from '../../../services/palette/palette.service';
import { NgDiagramPaletteItemPreviewComponent } from './ng-diagram-palette-item-preview.component';

@Component({
  standalone: true,
  imports: [NgDiagramPaletteItemPreviewComponent],
  template: `
    <ng-diagram-palette-item-preview>
      <span class="content">Node preview</span>
    </ng-diagram-palette-item-preview>
  `,
})
class HostComponent {}

// jsdom stores `zoom` verbatim without validating it, and reads back `undefined` when it was never set.
function zoomOf(element: HTMLElement): string {
  return element.style.zoom ?? '';
}

function setup(scale: number | WritableSignal<number>) {
  const previewId = signal<string | null>(null);

  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      { provide: NgDiagramViewportService, useValue: { scale: typeof scale === 'number' ? signal(scale) : scale } },
      { provide: EnvironmentProviderService, useValue: { generateId: () => 'preview-id', browser: 'Chrome' } },
      { provide: PaletteService, useValue: { previewId } },
    ],
  });

  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();

  const host = fixture.nativeElement.querySelector('ng-diagram-palette-item-preview') as HTMLElement;
  const component = fixture.debugElement.children[0].componentInstance as NgDiagramPaletteItemPreviewComponent;

  return { host, component, previewId, preview: component.preview()!.nativeElement };
}

describe('NgDiagramPaletteItemPreviewComponent', () => {
  beforeEach(() => {
    // jsdom has no CSS object; the default path under test is the CSS-zoom one.
    vi.stubGlobal('CSS', { supports: vi.fn(() => true) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('parked preview', () => {
    it('stays at natural size — the viewport zoom is not applied to it', () => {
      const { preview } = setup(5);

      expect(zoomOf(preview)).toBe('');
      expect(preview.style.transform).toBe('');
    });

    it('is parked off-screen by the dragged-node class', () => {
      const { preview } = setup(5);

      expect(preview.classList.contains('dragged-node')).toBe(true);
    });

    it('sits inside the clipping wrapper, out of any application stylesheet reach on the host', () => {
      const { host, preview } = setup(5);

      const clip = host.querySelector(':scope > .preview-clip');
      expect(clip).not.toBeNull();
      expect(preview.parentElement).toBe(clip);
    });

    it('keeps the content rendered so it can be cloned at dragstart', () => {
      const { host } = setup(5);

      expect(host.querySelector('.content')?.textContent).toBe('Node preview');
    });
  });

  describe('createDragImage', () => {
    it('returns a detached, fixed-positioned clone with the preview content', () => {
      const { component, preview } = setup(2.5);

      const clone = component.createDragImage()!;

      expect(clone).not.toBeNull();
      expect(clone).not.toBe(preview);
      expect(clone.isConnected).toBe(false);
      expect(clone.style.position).toBe('fixed');
      expect(clone.querySelector('.content')?.textContent).toBe('Node preview');
    });

    // `zoom` is layout-affecting, so the clone's own box covers the scaled content — which is what
    // setDragImage rasterizes. A `transform` would leave the box at natural size.
    it('scales the clone with zoom, leaving the parked preview untouched', () => {
      const { component, preview } = setup(2.5);

      const clone = component.createDragImage()!;

      expect(zoomOf(clone)).toBe('2.5');
      expect(clone.style.transform).toBe('');
      expect(zoomOf(preview)).toBe('');
    });

    // A fixed offset (like the parked copy's -1000px) stops working once the content is wider
    // than the offset; anchoring the right edge to the viewport's left edge works at any width.
    it('parks the clone by geometry: right edge on the viewport edge, content on its natural lines', () => {
      const { component } = setup(2);

      const clone = component.createDragImage()!;

      expect(clone.style.left).toBe('auto');
      expect(clone.style.right).toBe('100vw');
      expect(clone.style.width).toBe('max-content');
    });

    // Rasterization cost grows with the square of the zoom inside the synchronous dragstart, so
    // the applied zoom is capped — browsers downscale oversized drag bitmaps anyway.
    it('caps the applied zoom at 3', () => {
      const { component } = setup(10);

      expect(zoomOf(component.createDragImage()!)).toBe('3');
    });

    it('reads the viewport scale at call time', () => {
      const scale = signal(1);
      const { component } = setup(scale);

      scale.set(0.36);

      expect(zoomOf(component.createDragImage()!)).toBe('0.36');
    });

    it('without CSS zoom support, wraps the clone in a box sized to the scaled content', () => {
      vi.stubGlobal('CSS', { supports: vi.fn(() => false) });
      const { component, preview } = setup(2);
      // jsdom lays nothing out, so give the parked preview a concrete size to scale.
      vi.spyOn(preview, 'offsetWidth', 'get').mockReturnValue(340);
      vi.spyOn(preview, 'offsetHeight', 'get').mockReturnValue(200);

      const wrapper = component.createDragImage()!;
      const clone = wrapper.firstElementChild as HTMLElement;

      // setDragImage rasterizes the wrapper's box; the transform paints the clone into it.
      expect(wrapper.style.position).toBe('fixed');
      expect(wrapper.style.right).toBe('100vw');
      expect(wrapper.style.width).toBe('680px');
      expect(wrapper.style.height).toBe('400px');
      expect(clone.style.transform).toBe('scale(2)');
      expect(clone.style.transformOrigin).toBe('top left');
      // The stylesheet would still park the clone at -1000px inside the wrapper — neutralized.
      expect(clone.style.position).toBe('static');
      expect(clone.style.left).toBe('auto');
    });
  });

  describe('deprecated members', () => {
    it('scaleTransform still reports the current viewport scale', () => {
      const scale = signal(2);
      const { component } = setup(scale);

      expect(component.scaleTransform).toBe('scale(2)');

      scale.set(3);

      expect(component.scaleTransform).toBe('scale(3)');
    });

    it('scale still exposes the viewport scale to subclasses', () => {
      const { component } = setup(2.5);

      expect(component['scale']()).toBe(2.5);
    });

    it('isVisible still follows the palette preview id', () => {
      const { component, previewId } = setup(1);

      expect(component['isVisible']()).toBe(false);

      previewId.set('preview-id');

      expect(component['isVisible']()).toBe(true);
    });

    it('isChrome and isSafari still report the detected browser', () => {
      const { component } = setup(1);

      expect(component['isChrome']).toBe(true);
      expect(component['isSafari']).toBe(false);
    });
  });
});
