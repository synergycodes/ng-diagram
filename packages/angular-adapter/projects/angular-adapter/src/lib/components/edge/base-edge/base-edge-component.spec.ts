import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Edge } from '@angularflow/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { FlowCoreProviderService, RendererService } from '../../../services';
import { BaseEdgeLabelComponent } from '../../edge-label/base-edge-label.component';
import { BaseEdgeComponent } from './base-edge.component';

@Component({
  selector: 'angular-adapter-custom-edge',
  template: '', // Empty mock template
  standalone: true,
})
class MockAngularAdapterEdgeLabelComponent {}

describe('AngularAdapterCustomEdgeComponent', () => {
  let component: BaseEdgeComponent;
  let fixture: ComponentFixture<BaseEdgeComponent>;
  let mockEdge: Edge;
  let mockPath: string;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [FlowCoreProviderService, RendererService],
      imports: [BaseEdgeComponent],
    })
      .overrideComponent(BaseEdgeComponent, {
        remove: {
          imports: [BaseEdgeLabelComponent],
        },
        add: {
          imports: [MockAngularAdapterEdgeLabelComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BaseEdgeComponent);
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
    mockPath = 'M 0 0 L 100 100';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required edge input', () => {
    fixture.componentRef.setInput('data', mockEdge);
    fixture.componentRef.setInput('path', mockPath);
    fixture.componentRef.setInput('points', mockEdge.points);
    fixture.detectChanges();

    expect(component.data).toBeDefined();
    expect(component.data().id).toBe('test-edge');
  });

  it('should handle edge with no points', () => {
    mockEdge.points = [];

    fixture.componentRef.setInput('data', mockEdge);
    fixture.componentRef.setInput('path', '');
    fixture.componentRef.setInput('points', mockEdge.points);
    fixture.detectChanges();

    expect(component.path()).toBe('');
  });

  it('should return proper color when edge is selected', () => {
    mockEdge.selected = true;

    fixture.componentRef.setInput('data', mockEdge);
    fixture.componentRef.setInput('path', mockPath);
    fixture.componentRef.setInput('points', mockEdge.points);
    fixture.detectChanges();

    expect(component.stroke()).toBe('#888');
  });

  it('should return proper color when edge is not selected', () => {
    mockEdge.selected = false;

    fixture.componentRef.setInput('data', mockEdge);
    fixture.componentRef.setInput('path', mockPath);
    fixture.componentRef.setInput('points', mockEdge.points);
    fixture.componentRef.setInput('customStroke', 'red');
    fixture.detectChanges();

    expect(component.stroke()).toBe('red');
  });

  it('should return proper marker when edge has source arrowhead', () => {
    fixture.componentRef.setInput('data', mockEdge);
    fixture.componentRef.setInput('path', mockPath);
    fixture.componentRef.setInput('points', mockEdge.points);
    fixture.componentRef.setInput('customMarkerStart', 'arrowhead');
    fixture.detectChanges();

    expect(component.markerStart()).toBe('url(#arrowhead)');
  });

  it('should return proper marker when edge has target arrowhead', () => {
    fixture.componentRef.setInput('data', mockEdge);
    fixture.componentRef.setInput('path', mockPath);
    fixture.componentRef.setInput('points', mockEdge.points);
    fixture.componentRef.setInput('customMarkerEnd', 'arrowhead');
    fixture.detectChanges();

    expect(component.markerEnd()).toBe('url(#arrowhead)');
  });

  it('should return proper stroke opacity when edge is temporary', () => {
    fixture.componentRef.setInput('data', { ...mockEdge, temporary: true });
    fixture.componentRef.setInput('path', mockPath);
    fixture.componentRef.setInput('points', mockEdge.points);
    fixture.detectChanges();

    expect(component.strokeOpacity()).toBe(0.5);
  });
});
