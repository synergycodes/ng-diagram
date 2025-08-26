import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Edge, Point } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCoreProviderService, RendererService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { BaseEdgeLabelComponent } from '../../edge-label/base-edge-label.component';
import { NgDiagramBaseEdgeComponent } from './base-edge.component';

@Component({
  selector: 'ng-diagram-custom-edge',
  template: '', // Empty mock template
  standalone: true,
})
class MockNgDiagramEdgeLabelComponent {}

describe('NgDiagramBaseEdgeComponent', () => {
  let component: NgDiagramBaseEdgeComponent;
  let fixture: ComponentFixture<NgDiagramBaseEdgeComponent>;
  let mockEdge: Edge;
  let mockFlowCore: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let mockFlowCoreProvider: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(async () => {
    // Create mock for EdgeRoutingManager
    const mockEdgeRoutingManager = {
      hasRouting: vi.fn().mockReturnValue(true),
      computePath: vi.fn().mockImplementation((_routing: string, points: Point[]) => {
        if (points.length === 0) return '';
        if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
        return points.map((p: Point, i: number) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ');
      }),
      getDefaultRouting: vi.fn().mockReturnValue('polyline'),
    };

    // Create mock for commandHandler
    const mockCommandHandler = {
      emit: vi.fn(),
    };

    // Create mock FlowCore
    mockFlowCore = {
      edgeRoutingManager: mockEdgeRoutingManager,
      commandHandler: mockCommandHandler,
    };

    // Create mock provider
    mockFlowCoreProvider = {
      provide: vi.fn().mockReturnValue(mockFlowCore),
    };

    await TestBed.configureTestingModule({
      providers: [
        { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
        RendererService,
        InputEventsRouterService,
      ],
      imports: [NgDiagramBaseEdgeComponent],
    })
      .overrideComponent(NgDiagramBaseEdgeComponent, {
        remove: {
          imports: [BaseEdgeLabelComponent],
        },
        add: {
          imports: [MockNgDiagramEdgeLabelComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(NgDiagramBaseEdgeComponent);
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

  it('should compute path from edge points using routing manager', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.path()).toBe('M 0,0 L 100,100');
    expect(mockFlowCore.edgeRoutingManager.computePath).toHaveBeenCalled();
  });

  it('should handle edge with no points', () => {
    mockEdge.points = [];

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.path()).toBe('');
  });

  it('should use custom routing when provided', () => {
    mockEdge.routing = 'orthogonal';

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('routing', 'bezier');
    fixture.detectChanges();

    expect(mockFlowCore.edgeRoutingManager.hasRouting).toHaveBeenCalledWith('bezier');
    expect(mockFlowCore.edgeRoutingManager.computePath).toHaveBeenCalledWith('bezier', mockEdge.points);
  });

  it('should fallback to default routing when edge routing not available', () => {
    mockFlowCore.edgeRoutingManager.hasRouting.mockImplementation((routing: string) => routing === 'polyline');

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(mockFlowCore.edgeRoutingManager.getDefaultRouting).toHaveBeenCalled();
    expect(mockFlowCore.edgeRoutingManager.computePath).toHaveBeenCalledWith('polyline', mockEdge.points);
  });

  it('should return proper color when edge is not selected', () => {
    mockEdge.selected = false;

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('stroke', 'red');
    fixture.detectChanges();

    expect(component.stroke()).toBe('red');
  });

  it('should return proper marker when edge has source arrowhead', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('customMarkerStart', 'arrowhead');
    fixture.detectChanges();

    expect(component.markerStart()).toBe('url(#arrowhead)');
  });

  it('should return proper marker when edge has target arrowhead', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('customMarkerEnd', 'arrowhead');
    fixture.detectChanges();

    expect(component.markerEnd()).toBe('url(#arrowhead)');
  });

  it('should add class "temporary" when edge is temporary', () => {
    fixture.componentRef.setInput('edge', { ...mockEdge, temporary: true });
    fixture.detectChanges();

    const pathElement = fixture.nativeElement.querySelector('path');
    expect(pathElement.classList.contains('temporary')).toBe(true);
  });

  it('should sync routing changes back to model via commandHandler', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('routing', 'bezier');
    fixture.detectChanges();

    // Trigger effect by changing routing
    fixture.componentRef.setInput('routing', 'orthogonal');
    fixture.detectChanges();

    expect(mockFlowCore.commandHandler.emit).toHaveBeenCalledWith('updateEdge', {
      id: 'test-edge',
      edgeChanges: { routing: 'orthogonal' },
    });
  });

  it('should handle manual routing mode with custom points', () => {
    mockEdge.routingMode = 'manual';
    mockEdge.points = [
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
    ];

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.points()).toEqual(mockEdge.points);
    expect(mockFlowCore.edgeRoutingManager.computePath).toHaveBeenCalledWith(expect.any(String), mockEdge.points);
  });

  it('should compute points correctly', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.points()).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
  });

  it('should handle edge labels', () => {
    mockEdge.labels = [
      { id: 'label-1', positionOnEdge: 0.5 },
      { id: 'label-2', positionOnEdge: 0.75 },
    ];

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.labels()).toEqual(mockEdge.labels);
  });

  it('should handle edge with no labels', () => {
    mockEdge.labels = undefined;

    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.labels()).toEqual([]);
  });

  it('should handle stroke opacity input', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('strokeOpacity', 0.5);
    fixture.detectChanges();

    expect(component.strokeOpacity()).toBe(0.5);
  });

  it('should handle stroke width input', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('strokeWidth', 4);
    fixture.detectChanges();

    expect(component.strokeWidth()).toBe(4);
  });

  it('should use default values for stroke opacity and width', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    expect(component.strokeOpacity()).toBe(1);
    expect(component.strokeWidth()).toBe(2);
  });
});
