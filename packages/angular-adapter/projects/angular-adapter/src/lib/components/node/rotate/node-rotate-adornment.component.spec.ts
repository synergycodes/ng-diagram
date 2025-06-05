import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventMapperService } from '../../../services';
import { RotateHandleComponent } from './handle/rotate-handle.component';
import { NodeRotateAdornmentComponent } from './node-rotate-adornment.component';

describe('NodeRotateAdornmentComponent', () => {
  let component: NodeRotateAdornmentComponent;
  let fixture: ComponentFixture<NodeRotateAdornmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeRotateAdornmentComponent, RotateHandleComponent],
      providers: [{ provide: EventMapperService, useValue: { emit: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeRotateAdornmentComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('data', { id: '1', type: 'default', position: { x: 0, y: 0 }, selected: true });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit rotate event', () => {
    const pointerEvent = new Event('pointermove') as PointerEvent;
    Object.assign(pointerEvent, {
      clientX: 100,
      clientY: 200,
      pointerId: 1,
      pressure: 0.5,
      button: 0,
      ctrlKey: true,
      metaKey: false,
    });
    component.onPointerEvent({ event: pointerEvent, type: 'pointermove' });
    expect(TestBed.inject(EventMapperService).emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rotate',
        pointerId: 1,
        x: 100,
        y: 200,
        target: expect.objectContaining({ type: 'rotate-handle' }),
      })
    );
  });
});
