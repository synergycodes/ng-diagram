import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResizeLineComponent } from './resize-line.component';

describe('ResizeLineComponent', () => {
  let component: ResizeLineComponent;
  let fixture: ComponentFixture<ResizeLineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResizeLineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ResizeLineComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('position', 'bottom');
    fixture.componentRef.setInput('strokeWidth', 1);
    fixture.componentRef.setInput('color', '#1e90ff');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have proper position class', () => {
    expect(fixture.debugElement.classes).toHaveProperty('resize-line--bottom');
  });

  it('should have proper styles', () => {
    const elementStyles = fixture.debugElement.nativeElement.style;
    expect(elementStyles.borderBottom).toBe('1px solid #1e90ff');
  });

  it('should emit pointer down and up events', () => {
    const spy = vi.spyOn(component.pointerEvent, 'emit');

    const pointerDownEvent = new Event('pointerdown');
    fixture.debugElement.nativeElement.dispatchEvent(pointerDownEvent);

    expect(spy).toHaveBeenCalledWith({ event: pointerDownEvent, position: 'bottom' });

    const pointerUpEvent = new Event('pointerup');
    fixture.debugElement.nativeElement.dispatchEvent(pointerUpEvent);

    expect(spy).toHaveBeenCalledWith({ event: pointerUpEvent, position: 'bottom' });
  });
});
