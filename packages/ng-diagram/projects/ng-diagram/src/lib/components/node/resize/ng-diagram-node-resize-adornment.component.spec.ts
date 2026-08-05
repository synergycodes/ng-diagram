import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Node } from '../../../../core/src';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';
import { FlowCoreProviderService } from '../../../services';
import { InputEventsRouterService } from '../../../services/input-events/input-events-router.service';
import { NgDiagramNodeComponent } from '../ng-diagram-node.component';
import { NgDiagramResizeHandleComponent } from './handle/ng-diagram-resize-handle.component';
import { NgDiagramResizeLineComponent } from './line/ng-diagram-resize-line.component';
import { NgDiagramNodeResizeAdornmentComponent } from './ng-diagram-node-resize-adornment.component';
import { HandlePosition, ResizeEdge } from './ng-diagram-node-resize-adornment.types';

describe('NgDiagramNodeResizeAdornmentComponent', () => {
  let component: NgDiagramNodeResizeAdornmentComponent;
  let fixture: ComponentFixture<NgDiagramNodeResizeAdornmentComponent>;

  const node: Node = {
    id: 'test-node',
    position: { x: 0, y: 0 },
    data: {},
    selected: true,
    resizable: true,
  };

  const linesOf = (): NgDiagramResizeLineComponent[] =>
    fixture.debugElement.queryAll(By.directive(NgDiagramResizeLineComponent)).map((el) => el.componentInstance);

  const handlePositions = (): HandlePosition[] =>
    fixture.debugElement
      .queryAll(By.directive(NgDiagramResizeHandleComponent))
      .map((el) => el.componentInstance.position());

  const activeLinePositions = (): ResizeEdge[] =>
    linesOf()
      .filter((line) => line.active())
      .map((line) => line.position());

  /** Positions of the lines the DOM marks as inert — `pointer-events: none` comes from this class. */
  const inertLinePositions = (): ResizeEdge[] =>
    fixture.debugElement
      .queryAll(By.directive(NgDiagramResizeLineComponent))
      .filter((el) => (el.nativeElement as HTMLElement).classList.contains('resize-line--inactive'))
      .map((el) => el.componentInstance.position());

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgDiagramNodeResizeAdornmentComponent],
      providers: [
        { provide: NgDiagramNodeComponent, useValue: { node: signal(node) } },
        { provide: NgDiagramService, useValue: { config: signal({ resize: { defaultResizable: true } }) } },
        { provide: FlowCoreProviderService, useValue: { isInitialized: () => false, provide: vi.fn() } },
        { provide: InputEventsRouterService, useValue: { emit: vi.fn(), getBaseEvent: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NgDiagramNodeResizeAdornmentComponent);
    component = fixture.componentInstance;
  });

  it('renders all lines and all corner handles by default', () => {
    fixture.detectChanges();

    expect(linesOf().map((line) => line.position())).toEqual(['top', 'right', 'bottom', 'left']);
    expect(activeLinePositions()).toEqual(['top', 'right', 'bottom', 'left']);
    expect(handlePositions()).toEqual(['top-left', 'top-right', 'bottom-left', 'bottom-right']);
    expect(inertLinePositions()).toEqual([]);
  });

  it('activates only the listed edges and keeps the other lines rendered but inert', () => {
    fixture.componentRef.setInput('resizeEdges', ['right', 'bottom']);
    fixture.detectChanges();

    // All four lines still render — they double as the node's selection frame.
    expect(linesOf().map((line) => line.position())).toEqual(['top', 'right', 'bottom', 'left']);
    expect(activeLinePositions()).toEqual(['right', 'bottom']);
    expect(inertLinePositions()).toEqual(['top', 'left']);
  });

  it('renders a corner handle only when both of its edges are listed', () => {
    fixture.componentRef.setInput('resizeEdges', ['right', 'bottom']);
    fixture.detectChanges();

    expect(handlePositions()).toEqual(['bottom-right']);
    expect(component.handles().filter(({ active }) => active).length).toBe(1);
  });

  it('renders no corner handle when only one edge is listed', () => {
    fixture.componentRef.setInput('resizeEdges', ['bottom']);
    fixture.detectChanges();

    expect(activeLinePositions()).toEqual(['bottom']);
    expect(handlePositions()).toEqual([]);
  });

  it('keeps the selection frame without any interactive edge for an empty list', () => {
    fixture.componentRef.setInput('resizeEdges', []);
    fixture.detectChanges();

    expect(linesOf()).toHaveLength(4);
    expect(activeLinePositions()).toEqual([]);
    expect(handlePositions()).toEqual([]);
  });

  it('reacts to a changed edge list', () => {
    fixture.componentRef.setInput('resizeEdges', ['top', 'left']);
    fixture.detectChanges();

    expect(handlePositions()).toEqual(['top-left']);

    fixture.componentRef.setInput('resizeEdges', ['top', 'right']);
    fixture.detectChanges();

    expect(activeLinePositions()).toEqual(['top', 'right']);
    expect(handlePositions()).toEqual(['top-right']);
  });
});
