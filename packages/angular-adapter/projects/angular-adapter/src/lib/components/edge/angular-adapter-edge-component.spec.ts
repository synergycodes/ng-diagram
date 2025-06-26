import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
} from '../../directives';
import { AngularAdapterEdgeComponent } from './angular-adapter-edge.component';
import { AngularAdapterEdgeLabelComponent } from '../edge-label/angular-adapter-edge-label.component';
import { Edge } from '@angularflow/core';
import { Component } from '@angular/core';

@Component({
  selector: 'angular-adapter-edge-label',
  template: '', // Empty mock template
  standalone: true,
})
class MockAngularAdapterEdgeLabelComponent {}

describe('AngularAdapterEdgeComponent', () => {
  let component: AngularAdapterEdgeComponent;
  let fixture: ComponentFixture<AngularAdapterEdgeComponent>;
  let mockEdge: Edge;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularAdapterEdgeComponent],
    }).overrideComponent(AngularAdapterEdgeComponent, {
      remove: {
        imports: [AngularAdapterEdgeLabelComponent],
      },
      add: {
        imports: [MockAngularAdapterEdgeLabelComponent],
      },
    })
      .compileComponents();

    fixture = TestBed.createComponent(AngularAdapterEdgeComponent);
    fixture.componentRef.setInput('data', { id: '1', type: 'unknown', position: { x: 700, y: 300 }, data: {} });
    component = fixture.componentInstance;
    fixture.detectChanges();

    mockEdge = {
      id: 'test-edge',
      source: 'source-node',
      target: 'target-node',
      data: {},
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('should have PointerUpEventListenerDirective as host directive', () => {
    const pointerUpEventListenerDirective = fixture.debugElement.injector.get(PointerUpEventListenerDirective);
    expect(pointerUpEventListenerDirective).toBeTruthy();
  });

  it('should have ZIndexDirective as host directive', () => {
    const zIndexDirective = fixture.debugElement.injector.get(ZIndexDirective);
    expect(zIndexDirective).toBeTruthy();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required edge input', () => {
    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.data).toBeDefined();
    expect(component.data().id).toBe('test-edge');
  });

  it('should calculate path from edge points', () => {
    mockEdge.points = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ];

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.path()).toBe('M 10 20 L 30 40');
  });

  it('should handle edge with no points', () => {
    mockEdge.points = [];

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.path()).toBe('');
  });

  it('should return proper color when edge is selected', () => {
    mockEdge.selected = true;

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.stroke()).toBe('#888');
  });

  it('should return proper color when edge is not selected', () => {
    mockEdge.selected = false;

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.stroke()).toBe('#bbb');
  });

  it('should return proper marker when edge has source arrowhead', () => {
    mockEdge.sourceArrowhead = 'arrowhead';

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.markerStart()).toBe('url(#arrowhead)');
  });

  it('should return proper marker when edge has target arrowhead', () => {
    mockEdge.targetArrowhead = 'arrowhead';

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.markerEnd()).toBe('url(#arrowhead)');
  });

  it('should return proper stroke opacity when edge is temporary', () => {
    fixture.componentRef.setInput('data', { ...mockEdge, temporary: true });

    fixture.detectChanges();

    expect(component.strokeOpacity()).toBe(0.5);
  });
});
