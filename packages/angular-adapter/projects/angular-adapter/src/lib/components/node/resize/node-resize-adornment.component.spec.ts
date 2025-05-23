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

  it('should use default values for appearance when other values are not provided', () => {
    expect(component.size()).toBe(6);
    expect(component.strokeWidth()).toBe(1);
    expect(component.color()).toBe('#1e90ff');
    expect(component.backgroundColor()).toBe('#ffffff');
  });

  it('should use provided values for appearance when they are provided', () => {
    mockGetMetadata.mockReturnValue({
      nodeResizeAdornmentConfig: { handleSize: 10, strokeWidth: 2, color: '#ff0000', handleBackgroundColor: '#00ff00' },
    });
    fixture = TestBed.createComponent(NodeResizeAdornmentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { id: '1', type: 'default', position: { x: 0, y: 0 }, selected: false });
    fixture.detectChanges();

    expect(component.size()).toBe(10);
    expect(component.strokeWidth()).toBe(2);
    expect(component.color()).toBe('#ff0000');
    expect(component.backgroundColor()).toBe('#00ff00');
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
