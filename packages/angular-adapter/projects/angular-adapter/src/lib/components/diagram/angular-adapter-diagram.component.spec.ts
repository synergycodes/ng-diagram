import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Node } from '@angularflow/core';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerMoveEventListenerDirective,
  PointerUpEventListenerDirective,
} from '../../directives';
import { AngularAdapterDiagramComponent } from './angular-adapter-diagram.component';

describe('AngularAdapterDiagramComponent', () => {
  let component: AngularAdapterDiagramComponent;
  let fixture: ComponentFixture<AngularAdapterDiagramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterDiagramComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AngularAdapterDiagramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty nodes array', () => {
    expect(component.nodes()).toEqual([]);
  });

  it('should initialize with empty node template map', () => {
    expect(component.nodeTemplateMap().size).toBe(0);
  });

  it('should update nodes when input changes', () => {
    const testNodes: Node[] = [
      { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} },
      { id: '2', type: 'test', position: { x: 100, y: 100 }, data: {} },
    ];

    fixture.componentRef.setInput('nodes', testNodes);

    expect(component.nodes()).toEqual(testNodes);
  });

  it('should return null for non-existent node template', () => {
    expect(component.getNodeTemplate('non-existent')).toBeNull();
  });

  it('should return correct template for existing node type', () => {
    const mockTemplate = { template: 'test' };
    const templateMap = new Map([['test-type', mockTemplate]]);

    fixture.componentRef.setInput('nodeTemplateMap', templateMap);

    expect(component.getNodeTemplate('test-type')).toBe(mockTemplate);
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
});
