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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit pointer events', () => {
    const spy = vi.spyOn(component.pointerEvent, 'emit');
    const event = new Event('pointerdown') as PointerEvent;
    component.onPointerDown(event);
    expect(spy).toHaveBeenCalledWith({ event, type: 'pointerdown' });
  });
});
