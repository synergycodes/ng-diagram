import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PanelRegistryService } from '../../services/panel-registry/panel-registry.service';
import { NgDiagramPanelPosition } from '../../types/panel-position';
import { NgDiagramWatermarkComponent } from './watermark.component';

@Component({
  template: `<ng-diagram-watermark [preferredPosition]="preferredPosition()" />`,
  imports: [NgDiagramWatermarkComponent],
})
class TestHostComponent {
  preferredPosition = signal<NgDiagramPanelPosition | undefined>(undefined);
}

describe('NgDiagramWatermarkComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let watermark: NgDiagramWatermarkComponent;
  const panelPosition = signal<NgDiagramPanelPosition | undefined>(undefined);

  beforeEach(async () => {
    panelPosition.set(undefined);

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: PanelRegistryService,
          useValue: { position: panelPosition },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();

    watermark = fixture.debugElement.children[0].componentInstance;
  });

  it('defaults to bottom-right when no preferred position is set', () => {
    expect(watermark.position()).toBe('bottom-right');
  });

  it('uses the preferred position when set', () => {
    host.preferredPosition.set('top-left');
    fixture.detectChanges();

    expect(watermark.position()).toBe('top-left');
  });

  it('moves to fallback when preferred position collides with panel', () => {
    panelPosition.set('bottom-right');

    expect(watermark.position()).toBe('top-right');
  });

  it('moves to fallback when custom preferred position collides with panel', () => {
    host.preferredPosition.set('top-left');
    fixture.detectChanges();
    panelPosition.set('top-left');

    expect(watermark.position()).toBe('bottom-left');
  });

  it.each([
    { preferred: 'bottom-right', panel: 'bottom-right', expected: 'top-right' },
    { preferred: 'top-right', panel: 'top-right', expected: 'bottom-right' },
    { preferred: 'bottom-left', panel: 'bottom-left', expected: 'top-left' },
    { preferred: 'top-left', panel: 'top-left', expected: 'bottom-left' },
  ] as const)('collision avoidance: $preferred with panel at $panel → $expected', ({ preferred, panel, expected }) => {
    host.preferredPosition.set(preferred);
    fixture.detectChanges();
    panelPosition.set(panel);

    expect(watermark.position()).toBe(expected);
  });

  it('stays at preferred position when panel is at a different position', () => {
    host.preferredPosition.set('top-left');
    fixture.detectChanges();
    panelPosition.set('bottom-right');

    expect(watermark.position()).toBe('top-left');
  });
});
