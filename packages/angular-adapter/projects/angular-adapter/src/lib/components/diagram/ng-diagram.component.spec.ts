import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Metadata,
  Middleware,
  MiddlewareChain,
  MiddlewaresConfigFromMiddlewares,
  ModelAdapter,
} from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  FlowCoreProviderService,
  FlowResizeBatchProcessorService,
  PaletteService,
  RendererService,
} from '../../services';
import { NgDiagramComponent } from './ng-diagram.component';

describe('AngularAdapterDiagramComponent', () => {
  let component: NgDiagramComponent<MiddlewareChain, ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>>;
  let fixture: ComponentFixture<
    NgDiagramComponent<MiddlewareChain, ModelAdapter<Metadata<MiddlewaresConfigFromMiddlewares<[]>>>>
  >;
  const mockModel: ModelAdapter = {
    destroy: vi.fn(),
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
      imports: [NgDiagramComponent],
      providers: [
        {
          provide: RendererService,
          useValue: {
            clear: vi.fn(),
            nodes: vi.fn(),
            edges: vi.fn(),
            viewport: vi.fn(() => ({ x: 0, y: 0, scale: 1 })),
            draw: vi.fn(),
          },
        },
        {
          provide: FlowResizeBatchProcessorService,
          useValue: {
            initialize: vi.fn(),
          },
        },
        {
          provide: FlowCoreProviderService,
          useValue: {
            init: vi.fn(),
            destroy: vi.fn(),
            provide: vi.fn(),
          },
        },
        {
          provide: PaletteService,
          useValue: {
            onMouseDown: vi.fn(),
            onDragStartFromPalette: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NgDiagramComponent);
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

  it('should call flowCoreProvider.init every time the model reference changes', () => {
    const spy = vi.spyOn(TestBed.inject(FlowCoreProviderService), 'init');

    fixture = TestBed.createComponent(NgDiagramComponent);
    fixture.componentRef.setInput('model', mockModel);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('model', { ...mockModel });
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('should call flowCoreProvider.init only once with provided middlewares', () => {
    const spy = vi.spyOn(TestBed.inject(FlowCoreProviderService), 'init');
    const middlewares: Middleware[] = [{ name: 'test', execute: vi.fn().mockImplementation((state) => state) }];

    fixture = TestBed.createComponent(NgDiagramComponent);
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
