import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { NgDiagramViewportService } from '../../../public-services/ng-diagram-viewport.service';
import { EnvironmentProviderService } from '../../../services/environment-provider/environment-provider.service';
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
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      { provide: NgDiagramViewportService, useValue: { scale: typeof scale === 'number' ? signal(scale) : scale } },
      { provide: EnvironmentProviderService, useValue: { generateId: () => 'preview-id' } },
    ],
  });

  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();

  const host = fixture.nativeElement.querySelector('ng-diagram-palette-item-preview') as HTMLElement;
  const component = fixture.debugElement.children[0].componentInstance as NgDiagramPaletteItemPreviewComponent;

  return { host, component, preview: component.preview()!.nativeElement };
}

describe('NgDiagramPaletteItemPreviewComponent', () => {
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

    it('keeps the dragged-node park offset on the clone, so it scales off-screen with the zoom', () => {
      const { component } = setup(10);

      expect(component.createDragImage()!.classList.contains('dragged-node')).toBe(true);
    });

    it('reads the viewport scale at call time', () => {
      const scale = signal(1);
      const { component } = setup(scale);

      scale.set(0.36);

      expect(zoomOf(component.createDragImage()!)).toBe('0.36');
    });
  });

  describe('scaleTransform (deprecated)', () => {
    it('still reports the current viewport scale', () => {
      const scale = signal(2);
      const { component } = setup(scale);

      expect(component.scaleTransform).toBe('scale(2)');

      scale.set(3);

      expect(component.scaleTransform).toBe('scale(3)');
    });
  });
});
