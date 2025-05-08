import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularAdapterDiagramComponent, FlowCoreProviderService } from '@angularflow/angular-adapter';
import { loggerMiddleware } from '@angularflow/logger-middleware';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, AngularAdapterDiagramComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with three nodes', () => {
    const nodes = component.model().getNodes();
    expect(nodes.length).toBe(3);
    expect(nodes[0].type).toBe('input-field');
    expect(nodes[1].type).toBe('image');
    expect(nodes[2].type).toBe('unknown');
  });

  it('should have correct node template mappings', () => {
    expect(component.nodeTemplateMap.has('input-field')).toBeTruthy();
    expect(component.nodeTemplateMap.has('image')).toBeTruthy();
  });

  it('should initialize with two edges', () => {
    const edges = component.model().getEdges();
    expect(edges.length).toBe(2);
  });

  describe('after view init', () => {
    beforeEach(() => {
      TestBed.inject(FlowCoreProviderService).provide().unregisterMiddleware(loggerMiddleware.name);
    });

    it('should register logger middleware', () => {
      const spy = vi.spyOn(TestBed.inject(FlowCoreProviderService).provide(), 'registerMiddleware');

      component.ngAfterViewInit();

      expect(spy).toHaveBeenCalledWith(loggerMiddleware);
    });
  });
});
