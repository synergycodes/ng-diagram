import { Component, Provider, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionState, Edge, EdgeEnd, Point } from '../../../../core/src';
import { FlowCoreProviderService, RendererService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { RelinkingGestureService } from '../../../services/input-events/relinking-gesture.service';
import { MarkerRegistryService } from '../../../services/marker-registry/marker-registry.service';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { NgDiagramBaseEdgeLabelComponent } from '../../edge-label/base-edge-label/base-edge-label.component';
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
  let defaultRelinkable: boolean | EdgeEnd;
  let actionState: WritableSignal<ActionState>;
  let providers: Provider[];

  beforeEach(async () => {
    defaultRelinkable = false;
    actionState = signal<ActionState>({});
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

    providers = [
      { provide: FlowCoreProviderService, useValue: mockFlowCoreProvider },
      {
        provide: NgDiagramService,
        useValue: { config: () => ({ linking: { defaultRelinkable } }), actionState },
      },
      { provide: RelinkingGestureService, useValue: { beginRelink: vi.fn().mockReturnValue(false) } },
      RendererService,
      InputEventsRouterService,
      MarkerRegistryService,
    ];

    await TestBed.configureTestingModule({
      providers,
      imports: [NgDiagramBaseEdgeComponent],
    })
      .overrideComponent(NgDiagramBaseEdgeComponent, {
        remove: {
          imports: [NgDiagramBaseEdgeLabelComponent],
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
    fixture.componentRef.setInput('sourceArrowhead', 'arrowhead');
    fixture.detectChanges();

    expect(component.markerStart()).toBe('url(#arrowhead)');
  });

  it('should return proper marker when edge has target arrowhead', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.componentRef.setInput('targetArrowhead', 'arrowhead');
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
    const edgeWithLabels = {
      ...mockEdge,
      measuredLabels: [
        { id: 'label-1', positionOnEdge: 0.5 },
        { id: 'label-2', positionOnEdge: 0.75 },
      ],
    };

    fixture.componentRef.setInput('edge', edgeWithLabels);
    fixture.detectChanges();

    expect(component.labels()).toEqual(edgeWithLabels.measuredLabels);
  });

  it('should handle edge with no labels', () => {
    const edgeWithoutLabels = { ...mockEdge, measuredLabels: undefined };

    fixture.componentRef.setInput('edge', edgeWithoutLabels);
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

  it('should use default value for stroke opacity', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    const pathElement = fixture.nativeElement.querySelector('path');
    expect(pathElement.getAttribute('stroke-opacity')).toBe('var(--edge-stroke-opacity, 1)');
  });

  it('should use default value for stroke width', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    const pathElement = fixture.nativeElement.querySelector('path');
    expect(pathElement.getAttribute('stroke-width')).toBe('var(--edge-stroke-width, 2)');
  });

  it('should use default value for stroke color', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    const pathElement = fixture.nativeElement.querySelector('path');
    expect(pathElement.getAttribute('stroke')).toBe('var(--edge-stroke, var(--ngd-default-edge-stroke))');
  });

  it('should use default value for stroke dasharray', () => {
    fixture.componentRef.setInput('edge', mockEdge);
    fixture.detectChanges();

    const pathElement = fixture.nativeElement.querySelector('path');
    expect(pathElement.getAttribute('stroke-dasharray')).toBe('var(--edge-stroke-dasharray, none)');
  });

  describe('relink handles', () => {
    const handles = () => ({
      source: component.relinkSourceHandleVisible(),
      target: component.relinkTargetHandleVisible(),
    });

    const renderedHandles = () => ({
      source: fixture.nativeElement.querySelectorAll('[data-relink-handle="source"]').length,
      target: fixture.nativeElement.querySelectorAll('[data-relink-handle="target"]').length,
    });

    const renderedHits = (): number => fixture.nativeElement.querySelectorAll('[data-relink-handle-hit]').length;

    /** The inset custom properties of the element, as the stylesheet reads them. */
    const inset = (selector: string) => {
      const style = (fixture.nativeElement.querySelector(selector) as HTMLElement).style;
      return [
        style.getPropertyValue('--ngd-relink-handle-inset-x'),
        style.getPropertyValue('--ngd-relink-handle-inset-y'),
      ];
    };

    it.each<[boolean | EdgeEnd, boolean, boolean]>([
      [true, true, true],
      ['source', true, false],
      ['target', false, true],
      [false, false, false],
    ])('relinkable %j on a selected edge shows source=%s target=%s', (relinkable, source, target) => {
      fixture.componentRef.setInput('edge', { ...mockEdge, selected: true, relinkable });
      fixture.detectChanges();

      expect(handles()).toEqual({ source, target });
      expect(renderedHandles()).toEqual({ source: source ? 1 : 0, target: target ? 1 : 0 });
      expect(renderedHits()).toBe(Number(source) + Number(target));
    });

    it.each<[boolean | EdgeEnd, boolean, boolean]>([
      [true, true, true],
      ['source', true, false],
      ['target', false, true],
      [false, false, false],
    ])('defaultRelinkable %j applies to an edge without relinkable: source=%s target=%s', (value, source, target) => {
      defaultRelinkable = value;
      fixture.componentRef.setInput('edge', { ...mockEdge, selected: true });
      fixture.detectChanges();

      expect(handles()).toEqual({ source, target });
    });

    it('should let the edge override the default', () => {
      defaultRelinkable = true;
      fixture.componentRef.setInput('edge', { ...mockEdge, selected: true, relinkable: false });
      fixture.detectChanges();

      expect(handles()).toEqual({ source: false, target: false });
    });

    it('should hide both handles when the edge is not selected', () => {
      defaultRelinkable = true;
      fixture.componentRef.setInput('edge', { ...mockEdge, selected: false });
      fixture.detectChanges();

      expect(handles()).toEqual({ source: false, target: false });
      expect(renderedHandles()).toEqual({ source: 0, target: 0 });
    });

    it('should hide both handles on a temporary edge that previews a draw', () => {
      defaultRelinkable = true;
      fixture.componentRef.setInput('edge', { ...mockEdge, selected: true, temporary: true });
      fixture.detectChanges();

      expect(handles()).toEqual({ source: false, target: false });
    });

    it('should hide both handles on an edge without points', () => {
      defaultRelinkable = true;
      fixture.componentRef.setInput('edge', { ...mockEdge, selected: true, points: [] });
      fixture.detectChanges();

      expect(handles()).toEqual({ source: false, target: false });
    });

    describe('inset past the end of the line', () => {
      /** A selected orthogonal edge with a port at each end. */
      const portEdge = (points: Point[], overrides: Partial<Edge> = {}): Edge => ({
        ...mockEdge,
        selected: true,
        sourcePort: 'out',
        targetPort: 'in',
        routing: 'orthogonal',
        ...overrides,
        points,
      });

      beforeEach(() => {
        defaultRelinkable = true;
      });

      it('should point the handle and its hit circle out of the line along the end segment', () => {
        fixture.componentRef.setInput(
          'edge',
          portEdge([
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 80, y: 50 },
            { x: 100, y: 50 },
          ])
        );
        fixture.detectChanges();

        expect(inset('[data-relink-handle="source"]')).toEqual(['-1', '0']);
        expect(inset('[data-relink-handle-hit="source"]')).toEqual(['-1', '0']);
        expect(inset('[data-relink-handle="target"]')).toEqual(['1', '0']);
        expect(inset('[data-relink-handle-hit="target"]')).toEqual(['1', '0']);
      });

      it('should leave an end in place when its end segment has zero length', () => {
        fixture.componentRef.setInput(
          'edge',
          portEdge([
            { x: 0, y: 0 },
            { x: 0, y: 0 },
            { x: 0, y: 40 },
          ])
        );
        fixture.detectChanges();

        expect(inset('[data-relink-handle="source"]')).toEqual(['0', '0']);
        expect(inset('[data-relink-handle="target"]')).toEqual(['0', '1']);
      });

      it('should follow a slanted end segment', () => {
        fixture.componentRef.setInput(
          'edge',
          portEdge([
            { x: 0, y: 0 },
            { x: 30, y: 40 },
          ])
        );
        fixture.detectChanges();

        expect(inset('[data-relink-handle="source"]')).toEqual(['-0.6', '-0.8']);
        expect(inset('[data-relink-handle="target"]')).toEqual(['0.6', '0.8']);
      });

      it.each<[string, Partial<Edge>]>([
        ['a polyline edge', { routing: 'polyline' }],
        ['manual points', { routingMode: 'manual' }],
        ['an unregistered routing', { routing: 'custom' }],
        ['ends without a port', { sourcePort: undefined, targetPort: undefined }],
        [
          'free ends',
          {
            source: '',
            sourcePort: undefined,
            sourcePosition: { x: 0, y: 0 },
            target: '',
            targetPort: undefined,
            targetPosition: { x: 100, y: 0 },
          },
        ],
      ])('should move the handles of %s past the ends of the line', (_case, edge) => {
        mockFlowCore.edgeRoutingManager.hasRouting.mockImplementation((name: string) => name !== 'custom');
        fixture.componentRef.setInput(
          'edge',
          portEdge(
            [
              { x: 0, y: 0 },
              { x: 100, y: 0 },
            ],
            edge
          )
        );
        fixture.detectChanges();

        expect(inset('[data-relink-handle="source"]')).toEqual(['-1', '0']);
        expect(inset('[data-relink-handle="target"]')).toEqual(['1', '0']);
      });
    });

    describe('on the preview of a relink', () => {
      const startRelink = (end: EdgeEnd, relinkedEdge: Edge) =>
        actionState.set({
          linking: {
            sourceNodeId: relinkedEdge.source,
            sourcePortId: '',
            temporaryEdge: null,
            relink: { edgeId: relinkedEdge.id, end, originalEdge: relinkedEdge },
          },
        });

      const renderPreview = (end: EdgeEnd, relinkedEdge: Edge, preview: Partial<Edge> = {}) => {
        startRelink(end, relinkedEdge);
        fixture.componentRef.setInput('edge', { ...mockEdge, ...preview, id: 'TEMPORARY_EDGE', temporary: true });
        fixture.detectChanges();
      };

      const draggingHandles = (): string[] =>
        Array.from<Element>(fixture.nativeElement.querySelectorAll('.ng-diagram-edge__relink-handle--dragging')).map(
          (handle) => handle.getAttribute('data-relink-handle') ?? ''
        );

      beforeEach(() => {
        defaultRelinkable = true;
      });

      it.each<EdgeEnd>(['source', 'target'])(
        'should show both handles without hit circles and mark the dragged %s end',
        (end) => {
          renderPreview(end, mockEdge);

          expect(renderedHandles()).toEqual({ source: 1, target: 1 });
          expect(renderedHits()).toBe(0);
          expect(draggingHandles()).toEqual([end]);
        }
      );

      it('should hide the fixed end when the relinked edge does not allow relinking it', () => {
        defaultRelinkable = false;
        renderPreview('target', { ...mockEdge, relinkable: 'target' });

        expect(renderedHandles()).toEqual({ source: 0, target: 1 });
        expect(draggingHandles()).toEqual(['target']);
      });

      it('should show the fixed end when the relinked edge allows relinking it although the default is off', () => {
        defaultRelinkable = false;
        renderPreview('target', { ...mockEdge, relinkable: true });

        expect(renderedHandles()).toEqual({ source: 1, target: 1 });
      });

      // The dragged end keeps the inset as well, so its handle does not move
      // when the drop on empty canvas commits the free end at the pointer.
      it('should move the handles of the fixed and the dragged end past the ends of the line', () => {
        renderPreview('target', mockEdge, {
          sourcePort: 'out',
          routing: 'orthogonal',
          target: '',
          targetPosition: { x: 100, y: 50 },
          points: [
            { x: 0, y: 0 },
            { x: 20, y: 0 },
            { x: 20, y: 50 },
            { x: 100, y: 50 },
          ],
        });

        expect(inset('[data-relink-handle="source"]')).toEqual(['-1', '0']);
        expect(inset('[data-relink-handle="target"]')).toEqual(['1', '0']);
      });

      it('should leave edges other than the preview as they are', () => {
        startRelink('target', { ...mockEdge, id: 'other-edge' });
        fixture.componentRef.setInput('edge', mockEdge);
        fixture.detectChanges();

        expect(renderedHandles()).toEqual({ source: 0, target: 0 });

        fixture.componentRef.setInput('edge', { ...mockEdge, selected: true });
        fixture.detectChanges();

        expect(renderedHandles()).toEqual({ source: 1, target: 1 });
        expect(draggingHandles()).toEqual([]);
      });

      it('should hide both handles when the preview has no points', () => {
        mockEdge.points = [];
        renderPreview('target', mockEdge);

        expect(handles()).toEqual({ source: false, target: false });
      });
    });

    describe('hit area', () => {
      it('should have a 12px radius at zoom 1', () => {
        expect(component.relinkHandleHitRadius()).toBe(12);
      });

      it('should keep a 12px radius on screen at other zoom levels', () => {
        TestBed.inject(RendererService).viewport.set({ x: 0, y: 0, scale: 2 });

        expect(component.relinkHandleHitRadius()).toBe(6);
      });
    });
  });
});
