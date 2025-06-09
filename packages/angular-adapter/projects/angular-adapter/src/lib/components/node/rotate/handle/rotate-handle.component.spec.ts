import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RotateHandleComponent } from './rotate-handle.component';

describe('RotateHandleComponent', () => {
  let component: RotateHandleComponent;
  let fixture: ComponentFixture<RotateHandleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RotateHandleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RotateHandleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('size', 24);
    fixture.componentRef.setInput('color', '#1e90ff');
    fixture.componentRef.setInput('backgroundColor', '#fff');
    fixture.componentRef.setInput('isRotating', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute styles correctly', () => {
    expect(component.styles()).toEqual({
      '--handle-size': '24px',
      '--handle-bg': '#fff',
      '--handle-color': '#1e90ff',
    });
  });

  it('should emit pointerDownEvent on pointer down', () => {
    const spy = vi.spyOn(component.pointerDownEvent, 'emit');
    const event = new Event('pointerdown') as PointerEvent;
    component.onPointerDown(event);
    expect(spy).toHaveBeenCalledWith({ event });
  });

  it('should set data-rotating attribute when rotating', () => {
    fixture.componentRef.setInput('isRotating', true);
    fixture.detectChanges();
    expect(component.pointerDownAttr).toBe('true');
  });
});
