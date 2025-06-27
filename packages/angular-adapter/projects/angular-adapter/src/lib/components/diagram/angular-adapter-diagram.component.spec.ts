import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Middleware, ModelAdapter } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  KeyDownEventListenerDirective,
  KeyPressEventListenerDirective,
  KeyUpEventListenerDirective,
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerMoveEventListenerDirective,
  PointerUpEventListenerDirective,
  WheelEventListenerDirective,
} from '../../directives';
import { FlowCoreProviderService } from '../../services';
import { AngularAdapterDiagramComponent } from './angular-adapter-diagram.component';

describe('AngularAdapterDiagramComponent', () => {
  let component: AngularAdapterDiagramComponent<ModelAdapter>;
  let fixture: ComponentFixture<AngularAdapterDiagramComponent<ModelAdapter>>;
  const mockModel: ModelAdapter = {
    getNodes: vi.fn(),
    getEdges: vi.fn(),
    getMetadata: vi.fn(() => ({ viewport: { x: 0, y: 0, scale: 1 }, middlewaresMetadata: {} })),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    setMetadata: vi.fn(),
    onChange: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    updateMiddlewareMetadata: vi.fn(),
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
    expect(spy).toHaveBeenCalledWith(mockModel, middlewares);

    fixture.componentRef.setInput('middlewares', [...middlewares]);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should have PointerDownEventListenerDirective as host directive', () => {
    const pointerDownEventListenerDirective = fixture.debugElement.injector.get(PointerDownEventListenerDirective);
    expect(pointerDownEventListenerDirective).toBeTruthy();
  });

  it('should have PointerEnterEventListenerDirective as host directive', () => {
    const pointerEnterEventListenerDirective = fixture.debugElement.injector.get(PointerEnterEventListenerDirective);
    expect(pointerEnterEventListenerDirective).toBeTruthy();
  });

  it('should have PointerLeaveEventListenerDirective as host directive', () => {
    const pointerLeaveEventListenerDirective = fixture.debugElement.injector.get(PointerLeaveEventListenerDirective);
    expect(pointerLeaveEventListenerDirective).toBeTruthy();
  });

  it('should have PointerMoveEventListenerDirective as host directive', () => {
    const pointerMoveEventListenerDirective = fixture.debugElement.injector.get(PointerMoveEventListenerDirective);
    expect(pointerMoveEventListenerDirective).toBeTruthy();
  });

  it('should have PointerUpEventListenerDirective as host directive', () => {
    const pointerUpEventListenerDirective = fixture.debugElement.injector.get(PointerUpEventListenerDirective);
    expect(pointerUpEventListenerDirective).toBeTruthy();
  });

  it('should have KeyDownEventListenerDirective as host directive', () => {
    const keyDownEventListenerDirective = fixture.debugElement.injector.get(KeyDownEventListenerDirective);
    expect(keyDownEventListenerDirective).toBeTruthy();
  });

  it('should have KeyPressEventListenerDirective as host directive', () => {
    const keyPressEventListenerDirective = fixture.debugElement.injector.get(KeyPressEventListenerDirective);
    expect(keyPressEventListenerDirective).toBeTruthy();
  });

  it('should have KeyUpEventListenerDirective as host directive', () => {
    const keyUpEventListenerDirective = fixture.debugElement.injector.get(KeyUpEventListenerDirective);
    expect(keyUpEventListenerDirective).toBeTruthy();
  });

  it('should have KeyUpEventListenerDirective as host directive', () => {
    const wheelEventListenerDirective = fixture.debugElement.injector.get(WheelEventListenerDirective);
    expect(wheelEventListenerDirective).toBeTruthy();
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
