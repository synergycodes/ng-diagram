import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Edge } from '@angularflow/core';
import { beforeEach, describe, expect, it } from 'vitest';
import { EdgeStraightComponent } from './edge-straight.component';

describe('EdgeStraightComponent', () => {
  let component: EdgeStraightComponent;
  let fixture: ComponentFixture<EdgeStraightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EdgeStraightComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EdgeStraightComponent);
    component = fixture.componentInstance;

    const mockEdge: Edge = {
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
    const mockEdge: Edge = {
      id: 'test-edge',
      source: 'source-node',
      target: 'target-node',
      data: {},
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
    };

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.path).toBe('M 10 20 L 30 40');
  });

  it('should handle edge with no points', () => {
    const mockEdge: Edge = {
      id: 'no-points',
      source: 'source-node',
      target: 'target-node',
      data: {},
    };

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.path).toBe('');
  });
});
