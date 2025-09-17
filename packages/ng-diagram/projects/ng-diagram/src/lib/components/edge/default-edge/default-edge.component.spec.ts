import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Edge } from '@ng-diagram/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';
import { NgDiagramDefaultEdgeComponent } from './default-edge.component';

@Component({
  selector: 'ng-diagram-edge-label',
  template: '', // Empty mock template
  standalone: true,
})
class MockNgDiagramEdgeLabelComponent {}

describe('NgDiagramDefaultEdgeComponent', () => {
  let component: NgDiagramDefaultEdgeComponent;
  let fixture: ComponentFixture<NgDiagramDefaultEdgeComponent>;
  let mockEdge: Edge;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgDiagramDefaultEdgeComponent],
    })
      .overrideComponent(NgDiagramDefaultEdgeComponent, {
        remove: {
          imports: [NgDiagramBaseEdgeComponent],
        },
        add: {
          imports: [MockNgDiagramEdgeLabelComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NgDiagramDefaultEdgeComponent);
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
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.edge).toBeDefined();
    expect(component.edge().id).toBe('test-edge');
  });
});
