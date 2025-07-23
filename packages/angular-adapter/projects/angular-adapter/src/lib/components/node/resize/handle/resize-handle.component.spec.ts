import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResizeHandleComponent } from './resize-handle.component';

describe('ResizeHandleComponent', () => {
  let component: ResizeHandleComponent;
  let fixture: ComponentFixture<ResizeHandleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizeHandleComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResizeHandleComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('position', 'top-left');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit pointer down and up events', () => {
    const spy = vi.spyOn(component.pointerEvent, 'emit');

    const pointerDownEvent = new Event('pointerdown');
    fixture.debugElement.nativeElement.dispatchEvent(pointerDownEvent);

    expect(spy).toHaveBeenCalledWith({ event: pointerDownEvent, position: 'top-left' });

    const pointerUpEvent = new Event('pointerup');
    fixture.debugElement.nativeElement.dispatchEvent(pointerUpEvent);

    expect(spy).toHaveBeenCalledWith({ event: pointerUpEvent, position: 'top-left' });
  });
});
