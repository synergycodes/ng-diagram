import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Edge } from '@angularflow/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EdgeStraightComponent } from './edge-straight.component';

describe('EdgeStraightComponent', () => {
  let component: EdgeStraightComponent;
  let fixture: ComponentFixture<EdgeStraightComponent>;
  let mockEdge: Edge;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdgeStraightComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EdgeStraightComponent);
    component = fixture.componentInstance;

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

    fixture.componentRef.setInput('data', mockEdge);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required edge input', () => {
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
    expect(component.fill()).toBe('#888');
  });

  it('should return proper color when edge is not selected', () => {
    mockEdge.selected = false;

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.stroke()).toBe('#bbb');
    expect(component.fill()).toBe('#bbb');
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
});
