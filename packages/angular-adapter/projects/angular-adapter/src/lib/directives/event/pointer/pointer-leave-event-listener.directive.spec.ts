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
  eventTarget = input<EventTarget | null>(null);
}

describe('PointerLeaveEventListenerDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerLeaveEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement.injector.get(PointerLeaveEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call stopPropagation and preventDefault methods of the event', () => {
    const event = new Event('pointerleave');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    fixture.debugElement.nativeElement.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  describe('when eventTarget is null', () => {
    it('should call eventMapperService.emit with null as eventTarget', () => {
      const event = new Event('pointerleave');
      Object.assign(event, { pressure: 0, clientX: 10, clientY: 10 });
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerleave',
        target: null,
        pressure: 0,
        timestamp: expect.any(Number),
        x: 10,
        y: 10,
      });
    });
  });

  describe('when eventTarget is not null', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('eventTarget', { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} });
    });

    it('should call eventMapperService.emit with eventTarget', () => {
      const event = new Event('pointerleave');
      Object.assign(event, { pressure: 0, clientX: 10, clientY: 10 });
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerleave',
        target: component.eventTarget(),
        pressure: 0,
        timestamp: expect.any(Number),
        x: 10,
        y: 10,
      });
    });
  });
});
