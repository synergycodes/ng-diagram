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
  eventTarget = input<EventTarget | null>(null);
}

describe('PointerDownEventListenerDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerDownEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement.injector.get(PointerDownEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call stopPropagation method on the event', () => {
    const event = new Event('pointerdown');
    const spy = vi.spyOn(event, 'stopPropagation');

    fixture.debugElement.nativeElement.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
  });

  describe('when eventTarget is null', () => {
    it('should call eventMapperService.emit with null as eventTarget', () => {
      const event = new Event('pointerdown');
      Object.assign(event, { pressure: 0, clientX: 10, clientY: 10 });
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerdown',
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
      const event = new Event('pointerdown');
      Object.assign(event, { pressure: 0, clientX: 10, clientY: 10 });
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerdown',
        target: component.eventTarget(),
        pressure: 0,
        timestamp: expect.any(Number),
        x: 10,
        y: 10,
      });
    });
  });
});
