import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService, FlowCoreProviderService } from '../../../services';
import { ResizeHandleComponent } from './handle/resize-handle.component';
import { ResizeLineComponent } from './line/resize-line.component';
import { NodeResizeAdornmentComponent } from './node-resize-adornment.component';

describe('NodeResizeAdornmentComponent', () => {
  let component: NodeResizeAdornmentComponent;
  let fixture: ComponentFixture<NodeResizeAdornmentComponent>;
  const mockGetMetadata = vi.fn(() => ({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeResizeAdornmentComponent, ResizeHandleComponent, ResizeLineComponent],
      providers: [
        { provide: EventMapperService, useValue: { emit: vi.fn() } },
        {
          provide: FlowCoreProviderService,
          useValue: { provide: vi.fn(() => ({ model: { getMetadata: mockGetMetadata } })) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeResizeAdornmentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { id: '1', type: 'default', position: { x: 0, y: 0 }, selected: false });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show adornment when node is not resizable', () => {
    fixture.componentRef.setInput('data', { ...component.data(), selected: true });
    fixture.detectChanges();

    expect(component.showAdornment()).toBe(false);
  });

  it('should show adornment when node is selected and resizable', () => {
    fixture.componentRef.setInput('data', { ...component.data(), selected: true, resizable: true });
    fixture.detectChanges();

    expect(component.showAdornment()).toBe(true);
  });

  it('should stop event propagation', () => {
    const pointerEvent = new Event('pointerdown') as PointerEvent;
    const spy = vi.spyOn(pointerEvent, 'stopPropagation');

    component.onPointerEvent({ event: pointerEvent, position: 'top-left' });

    expect(spy).toHaveBeenCalled();
  });

  it('should emit pointer events with correct data', () => {
    const pointerEvent = new Event('pointerdown') as PointerEvent;
    Object.assign(pointerEvent, {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      pressure: 0.5,
      button: 0,
      ctrlKey: true,
      metaKey: false,
    });

    component.onPointerEvent({ event: pointerEvent, position: 'top-left' });

    expect(TestBed.inject(EventMapperService).emit).toHaveBeenCalledWith({
      type: 'pointerdown',
      pointerId: 1,
      timestamp: expect.any(Number),
      target: { type: 'resize-handle', position: 'top-left', element: component.data() },
      x: 100,
      y: 200,
      pressure: 0.5,
      ctrlKey: true,
      metaKey: false,
      button: 0,
    });
  });
});
