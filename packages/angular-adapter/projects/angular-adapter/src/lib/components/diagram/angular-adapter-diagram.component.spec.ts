import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelAdapter } from '@angularflow/core';
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
} from '../../directives';
import { FlowCoreProviderService, ModelProviderService } from '../../services';
import { AngularAdapterDiagramComponent } from './angular-adapter-diagram.component';

describe('AngularAdapterDiagramComponent', () => {
  let component: AngularAdapterDiagramComponent;
  let fixture: ComponentFixture<AngularAdapterDiagramComponent>;
  const mockModel: ModelAdapter = {
    getNodes: vi.fn(),
    getEdges: vi.fn(),
    getMetadata: vi.fn(() => ({ viewport: { x: 0, y: 0, scale: 1 } })),
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

  it('should call modelProvider.init when model input changes', () => {
    const spy = vi.spyOn(TestBed.inject(ModelProviderService), 'init');
    const newModel: ModelAdapter = { ...mockModel, getNodes: vi.fn() };

    fixture = TestBed.createComponent(AngularAdapterDiagramComponent);
    fixture.componentRef.setInput('model', newModel);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(newModel);

    fixture.componentRef.setInput('model', { ...mockModel, getEdges: vi.fn() });
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call flowCore.init when model input changes', () => {
    const spy = vi.spyOn(TestBed.inject(FlowCoreProviderService), 'init');
    const newModel: ModelAdapter = { ...mockModel, getNodes: vi.fn() };

    fixture = TestBed.createComponent(AngularAdapterDiagramComponent);
    fixture.componentRef.setInput('model', newModel);
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('model', { ...mockModel, getEdges: vi.fn() });
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
});
