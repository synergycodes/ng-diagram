import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { EventTarget } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { PointerDownEventListenerDirective } from './pointer-down-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: PointerDownEventListenerDirective, inputs: ['eventTarget'] }],
})
class TestComponent {
  eventTarget = input<EventTarget>();
}

describe('PointerDownEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerDownEventListenerDirective;
  let mockCurrentTarget: HTMLDivElement;
  let mockEvent: Event;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(PointerDownEventListenerDirective);
    fixture.detectChanges();
  });

  beforeEach(() => {
    mockCurrentTarget = document.createElement('div');
    Object.assign(mockCurrentTarget, { setPointerCapture: vi.fn() });
    mockEvent = new Event('pointerdown');
    Object.assign(mockEvent, { pressure: 0, clientX: 10, clientY: 10 });
    vi.spyOn(mockEvent, 'currentTarget', 'get').mockReturnValue(mockCurrentTarget);
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call stopPropagation method on the event', () => {
    const spy = vi.spyOn(mockEvent, 'stopPropagation');

    fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

    expect(spy).toHaveBeenCalled();
  });

  it('should call setPointerCapture method on the currentTarget', () => {
    const spy = vi.spyOn(mockCurrentTarget, 'setPointerCapture');

    fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

    expect(spy).toHaveBeenCalled();
  });

  describe('when eventTarget is not provided', () => {
    it('should call eventMapperService.emit with diagram as eventTarget', () => {
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerdown',
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

    it('should call eventMapperService.emit with provided eventTarget', () => {
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerdown',
        target: { type: 'node', element: { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} } },
        pressure: 0,
        timestamp: expect.any(Number),
        x: 10,
        y: 10,
      });
    });
  });
});
