import { Component, signal, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
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

// jsdom does not implement the `zoom` property, so an unset value reads as `undefined` instead of ''.
function zoomOf(element: HTMLElement): string {
  return element.style.zoom ?? '';
}

function setup(browser: 'Chrome' | 'Safari', scale: number | WritableSignal<number>) {
  TestBed.configureTestingModule({
    imports: [HostComponent],
    providers: [
      { provide: NgDiagramViewportService, useValue: { scale: typeof scale === 'number' ? signal(scale) : scale } },
      { provide: EnvironmentProviderService, useValue: { browser, generateId: () => 'preview-id' } },
    ],
  });

  const fixture = TestBed.createComponent(HostComponent);
  fixture.detectChanges();

  const host = fixture.nativeElement.querySelector('ng-diagram-palette-item-preview') as HTMLElement;
  const component = fixture.debugElement.children[0].componentInstance as NgDiagramPaletteItemPreviewComponent;
  const outer = component.preview()!.nativeElement;
  const inner = outer.firstElementChild as HTMLElement;

  return { host, component, outer, inner };
}

describe('NgDiagramPaletteItemPreviewComponent', () => {
  describe('parked preview', () => {
    it('is rendered at natural size — no zoom or transform applied (Chrome)', () => {
      const { outer, inner } = setup('Chrome', 5);

      expect(zoomOf(outer)).toBe('');
      expect(outer.style.transform).toBe('');
      expect(inner.style.transform).toBe('');
      expect(inner.classList.contains('dragged-node')).toBe(true);
      expect(outer.classList.contains('dragged-node')).toBe(false);
    });

    it('is rendered at natural size — no zoom or transform applied (Safari)', () => {
      const { outer, inner } = setup('Safari', 5);

      expect(zoomOf(outer)).toBe('');
      expect(inner.style.transform).toBe('');
      expect(outer.classList.contains('dragged-node')).toBe(true);
      expect(inner.classList.contains('dragged-node')).toBe(false);
    });

    it('keeps the content rendered so it can be cloned at dragstart', () => {
      const { host } = setup('Chrome', 5);

      expect(host.querySelector('.content')?.textContent).toBe('Node preview');
    });
  });

  describe('createDragImage', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('returns a detached, fixed-positioned clone with the preview content', () => {
      const { component } = setup('Chrome', 2.5);

      const clone = component.createDragImage()!;

      expect(clone).not.toBeNull();
      expect(clone.isConnected).toBe(false);
      expect(clone.classList.contains('dragged-node')).toBe(true);
      expect(clone.style.position).toBe('fixed');
      expect(clone.querySelector('.content')?.textContent).toBe('Node preview');
    });

    it('scales the inner element of the clone with a top-left origin (Chrome)', () => {
      const { component, outer, inner } = setup('Chrome', 2.5);

      const clone = component.createDragImage()!;
      const clonedInner = clone.firstElementChild as HTMLElement;

      expect(clonedInner.style.transform).toBe('scale(2.5)');
      expect(clonedInner.style.transformOrigin).toBe('top left');
      expect(zoomOf(clone)).toBe('');
      // The parked copy stays untouched.
      expect(zoomOf(outer)).toBe('');
      expect(inner.style.transform).toBe('');
    });

    it('zooms the clone itself (Safari)', () => {
      const { component, outer } = setup('Safari', 2.5);

      const clone = component.createDragImage()!;
      const clonedInner = clone.firstElementChild as HTMLElement;

      expect(zoomOf(clone)).toBe('2.5');
      expect(clonedInner.style.transform).toBe('');
      expect(zoomOf(outer)).toBe('');
    });

    it('reads the viewport scale at call time', () => {
      const scale = signal(1);
      const { component } = setup('Chrome', scale);

      scale.set(0.36);
      const clonedInner = component.createDragImage()!.firstElementChild as HTMLElement;

      expect(clonedInner.style.transform).toBe('scale(0.36)');
    });
  });
});
