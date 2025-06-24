import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Edge } from '@angularflow/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { AngularAdapterEdgeLabelComponent } from '../../edge-label/angular-adapter-edge-label.component';
import { EdgeOrthogonalComponent } from './edge-orthogonal.component';

@Component({
  selector: 'angular-adapter-edge-label',
  template: '', // Empty mock template
  standalone: true,
})
class MockAngularAdapterEdgeLabelComponent {}

describe('EdgeOrthogonalComponent', () => {
  let component: EdgeOrthogonalComponent;
  let fixture: ComponentFixture<EdgeOrthogonalComponent>;
  let mockEdge: Edge;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdgeOrthogonalComponent],
    })
      .overrideComponent(EdgeOrthogonalComponent, {
        remove: {
          imports: [AngularAdapterEdgeLabelComponent],
        },
        add: {
          imports: [MockAngularAdapterEdgeLabelComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(EdgeOrthogonalComponent);
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

  it('should calculate straight path from edge points', () => {
    mockEdge.points = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ];

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.path()).toBe('M 10 20 L 30 40');
  });

  it('should calculate path from edge points', () => {
    mockEdge.points = [
      { x: 10, y: 20 },
      { x: 20, y: 20 },
      { x: 20, y: 40 },
      { x: 30, y: 40 },
    ];

    fixture.componentRef.setInput('data', mockEdge);
    fixture.detectChanges();

    expect(component.path()).toBe('M 10,20 L15,20 A5,5,0,0,1,20,25 L20,35 A5,5,0,0,0,25,40 L 30,40');
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
