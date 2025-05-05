import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Node } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { PointerUpEventListenerDirective } from './pointer-up-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: PointerUpEventListenerDirective, inputs: ['eventTarget'] }],
})
class TestComponent {
  eventTarget = input<Node | null>(null);
}

describe('PointerUpEventListenerDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerUpEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement.injector.get(PointerUpEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call stopPropagation and preventDefault methods of the event', () => {
    const event = new Event('pointerup');
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    fixture.debugElement.nativeElement.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  describe('when eventTarget is null', () => {
    it('should call eventMapperService.emit with null as eventTarget', () => {
      const event = new Event('pointerup');
      Object.assign(event, { pressure: 0, clientX: 10, clientY: 10 });
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerup',
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
      const event = new Event('pointerup');
      Object.assign(event, { pressure: 0, clientX: 10, clientY: 10 });
      const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({
        type: 'pointerup',
        target: component.eventTarget(),
        pressure: 0,
        timestamp: expect.any(Number),
        x: 10,
        y: 10,
      });
    });
  });
});
