import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { Metadata, MiddlewareChain, MiddlewaresConfigFromMiddlewares } from '@angularflow/core';
import { Middleware, ModelAdapter } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCoreProviderService } from '../../services';
import { AngularAdapterDiagramComponent } from './angular-adapter-diagram.component';

describe('AngularAdapterDiagramComponent', () => {
  let component: AngularAdapterDiagramComponent<
    MiddlewareChain,
    ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>
  >;
  let fixture: ComponentFixture<
    AngularAdapterDiagramComponent<MiddlewareChain, ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>>
  >;
  const mockModel: ModelAdapter = {
    getNodes: vi.fn(),
    getEdges: vi.fn(),
    getMetadata: vi.fn(() => ({ viewport: { x: 0, y: 0, scale: 1 }, middlewaresConfig: {} })),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    setMetadata: vi.fn(),
    onChange: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterDiagramComponent],
      providers: [{ provide: FlowCoreProviderService, useValue: { init: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularAdapterDiagramComponent);
    fixture.componentRef.setInput('model', mockModel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty node template map', () => {
    expect(component.nodeTemplateMap().size).toBe(0);
  });

  it('should call flowCoreProvider.init only once with provided model', () => {
    const spy = vi.spyOn(TestBed.inject(FlowCoreProviderService), 'init');

    fixture = TestBed.createComponent(AngularAdapterDiagramComponent);
    fixture.componentRef.setInput('model', mockModel);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('model', { ...mockModel });
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call flowCoreProvider.init only once with provided middlewares', () => {
    const spy = vi.spyOn(TestBed.inject(FlowCoreProviderService), 'init');
    const middlewares: Middleware[] = [{ name: 'test', execute: vi.fn().mockImplementation((state) => state) }];

    fixture = TestBed.createComponent(AngularAdapterDiagramComponent);
    fixture.componentRef.setInput('model', mockModel);
    fixture.componentRef.setInput('middlewares', middlewares);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
    const callArgs = spy.mock.calls[0];
    expect(callArgs[0]).toBe(mockModel);
    expect(callArgs[1]).toBe(middlewares);
    expect(typeof callArgs[2]).toBe('function');

    fixture.componentRef.setInput('middlewares', [...middlewares]);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  describe('getNodeTemplate', () => {
    it('should return null for non-existent node template', () => {
      expect(component.getNodeTemplate('non-existent')).toBeNull();
    });

    it('should return correct template for existing node type', () => {
      const mockTemplate = { template: 'test' };
      const templateMap = new Map([['test-type', mockTemplate]]);

      fixture.componentRef.setInput('nodeTemplateMap', templateMap);

      expect(component.getNodeTemplate('test-type')).toBe(mockTemplate);
    });
  });

  describe('getEdgeTemplate', () => {
    it('should return null for non-existent edge template', () => {
      expect(component.getEdgeTemplate('non-existent')).toBeNull();
    });

    it('should return null if edge type is undefined', () => {
      expect(component.getEdgeTemplate(undefined)).toBeNull();
    });

    it('should return correct template for existing edge type', () => {
      const mockTemplate = { template: 'test' };
      const templateMap = new Map([['test-type', mockTemplate]]);

      fixture.componentRef.setInput('edgeTemplateMap', templateMap);

      expect(component.getEdgeTemplate('test-type')).toBe(mockTemplate);
    });
  });
});
