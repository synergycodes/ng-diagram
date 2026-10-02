import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore, TemplateVisibilityRegistry } from '../../../../core/src';
import { FlowCoreProviderService } from '../../../services';
import { BatchResizeObserverService } from '../../../services/flow-resize-observer/batched-resize-observer.service';
import { NgDiagramBaseEdgeComponent } from '../../edge/base-edge/base-edge.component';
import { NgDiagramBaseEdgeLabelComponent } from './base-edge-label.component';

@Component({
  template: `<ng-diagram-base-edge-label [id]="'label1'" [positionOnEdge]="0.5" [hidden]="hidden()" />`,
  imports: [NgDiagramBaseEdgeLabelComponent],
})
class TestComponent {
  hidden = signal(false);
}

describe('NgDiagramBaseEdgeLabelComponent hidden input', () => {
  let fixture: ComponentFixture<TestComponent>;
  let registry: TemplateVisibilityRegistry;
  let addEdgeLabel: ReturnType<typeof vi.fn>;

  const createFixture = (initiallyHidden = false, template?: string) => {
    registry = new TemplateVisibilityRegistry();
    addEdgeLabel = vi.fn();
    const flowCore = {
      templateVisibilityRegistry: registry,
      updater: { addEdgeLabel, applyEdgeLabelChanges: vi.fn(), deleteEdgeLabel: vi.fn() },
      isInitialized: true,
      getEdgeById: vi.fn().mockReturnValue({ id: 'edge1' }),
    };

    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [
        {
          provide: FlowCoreProviderService,
          useValue: { provide: () => flowCore as unknown as FlowCore },
        },
        {
          provide: BatchResizeObserverService,
          useValue: { observe: vi.fn(), unobserve: vi.fn(), invalidate: vi.fn() },
        },
        {
          provide: NgDiagramBaseEdgeComponent,
          useValue: { edge: () => ({ id: 'edge1', points: [], measuredLabels: [] }) },
        },
      ],
    });
    if (template) {
      TestBed.overrideComponent(TestComponent, { set: { template } });
    }
    TestBed.compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    if (initiallyHidden) {
      fixture.componentInstance.hidden.set(true);
    }
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('should render as display: none when hidden', () => {
    createFixture(true);

    const host: HTMLElement = fixture.debugElement.query(By.css('ng-diagram-base-edge-label')).nativeElement;
    expect(host.style.display).toBe('none');
  });

  it('should not set an inline display value when visible', () => {
    createFixture(false);

    const host: HTMLElement = fixture.debugElement.query(By.css('ng-diagram-base-edge-label')).nativeElement;
    expect(host.style.display).toBe('');
  });

  it('should treat the static attribute form as hidden', () => {
    createFixture(false, `<ng-diagram-base-edge-label [id]="'label1'" [positionOnEdge]="0.5" hidden />`);

    const host: HTMLElement = fixture.debugElement.query(By.css('ng-diagram-base-edge-label')).nativeElement;
    expect(host.style.display).toBe('none');
    expect(registry.isLabelHidden('edge1', 'label1')).toBe(true);
  });

  it('should declare hidden state in the registry before registering the label', () => {
    createFixture(true);

    expect(registry.isLabelHidden('edge1', 'label1')).toBe(true);
    expect(addEdgeLabel).toHaveBeenCalledWith('edge1', expect.objectContaining({ id: 'label1' }));
  });

  it('should not write the registry when visible at init', () => {
    createFixture(false);

    expect(registry.isLabelHidden('edge1', 'label1')).toBe(false);
  });

  it('should toggle the registry at runtime', () => {
    createFixture(false);

    fixture.componentInstance.hidden.set(true);
    fixture.detectChanges();
    expect(registry.isLabelHidden('edge1', 'label1')).toBe(true);

    fixture.componentInstance.hidden.set(false);
    fixture.detectChanges();
    expect(registry.isLabelHidden('edge1', 'label1')).toBe(false);
  });

  it('should clear its registry declaration on destroy', () => {
    createFixture(true);
    expect(registry.isLabelHidden('edge1', 'label1')).toBe(true);

    fixture.destroy();

    expect(registry.isLabelHidden('edge1', 'label1')).toBe(false);
  });
});
