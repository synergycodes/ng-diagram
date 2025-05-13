import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { WheelEventListenerDirective } from './wheel-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: WheelEventListenerDirective }],
})
class TestComponent {}

describe('WheelEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: WheelEventListenerDirective;
  let mockEvent: Event;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(WheelEventListenerDirective);
    fixture.detectChanges();
  });

  beforeEach(() => {
    mockEvent = new Event('wheel');
    Object.assign(mockEvent, { clientX: 10, clientY: 10, deltaX: 10, deltaY: 20, deltaZ: 30 });
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call stopPropagation method on the event', () => {
    const spy = vi.spyOn(mockEvent, 'stopPropagation');

    fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

    expect(spy).toHaveBeenCalled();
  });

  it('should call preventDefault method on the event', () => {
    const spy = vi.spyOn(mockEvent, 'preventDefault');

    fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

    expect(spy).toHaveBeenCalled();
  });

  it('should call eventMapperService.emit with diagram as eventTarget', () => {
    const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

    fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

    expect(spy).toHaveBeenCalledWith({
      type: 'wheel',
      target: { type: 'diagram' },
      timestamp: expect.any(Number),
      x: 10,
      y: 10,
      deltaX: 10,
      deltaY: 20,
      deltaZ: 30,
    });
  });
});
