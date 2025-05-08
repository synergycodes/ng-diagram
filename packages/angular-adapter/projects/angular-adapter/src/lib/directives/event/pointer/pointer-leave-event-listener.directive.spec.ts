import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { EventTarget } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { PointerLeaveEventListenerDirective } from './pointer-leave-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: PointerLeaveEventListenerDirective, inputs: ['eventTarget'] }],
})
class TestComponent {
  eventTarget = input<EventTarget>();
}

describe('PointerLeaveEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerLeaveEventListenerDirective;
  let mockEvent: Event;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(PointerLeaveEventListenerDirective);
    fixture.detectChanges();
  });

  beforeEach(() => {
    mockEvent = new Event('pointerleave');
    Object.assign(mockEvent, { pressure: 0, clientX: 10, clientY: 10 });
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call stopPropagation method on the event', () => {
    const spy = vi.spyOn(mockEvent, 'stopPropagation');

    fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

    expect(spy).toHaveBeenCalled();
  });

  describe('when eventTarget is not provided', () => {
    it('should call eventMapperService.emit with diagram as eventTarget', () => {
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerleave',
        target: { type: 'diagram' },
        pressure: 0,
        timestamp: expect.any(Number),
        x: 10,
        y: 10,
      });
    });
  });

  describe('when eventTarget is provided', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('eventTarget', {
        type: 'node',
        element: { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} },
      });
    });

    it('should call eventMapperService.emit with eventTarget', () => {
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerleave',
        target: { type: 'node', element: { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} } },
        pressure: 0,
        timestamp: expect.any(Number),
        x: 10,
        y: 10,
      });
    });
  });
});
