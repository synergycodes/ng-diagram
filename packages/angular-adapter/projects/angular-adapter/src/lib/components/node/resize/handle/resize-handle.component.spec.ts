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
    fixture.componentRef.setInput('size', 6);
    fixture.componentRef.setInput('strokeWidth', 1);
    fixture.componentRef.setInput('color', '#1e90ff');
    fixture.componentRef.setInput('backgroundColor', '#ffffff');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have proper position class', () => {
    expect(fixture.debugElement.classes).toHaveProperty('resize-handle--top-left');
  });

  it('should have proper styles', () => {
    expect(fixture.debugElement.styles).toHaveProperty('width', '6px');
    expect(fixture.debugElement.styles).toHaveProperty('height', '6px');
    expect(fixture.debugElement.styles).toHaveProperty('backgroundColor', 'rgb(255, 255, 255)');
    expect(fixture.debugElement.styles).toHaveProperty('borderColor', 'rgb(30, 144, 255)');
    expect(fixture.debugElement.styles).toHaveProperty('borderWidth', '1px');
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
