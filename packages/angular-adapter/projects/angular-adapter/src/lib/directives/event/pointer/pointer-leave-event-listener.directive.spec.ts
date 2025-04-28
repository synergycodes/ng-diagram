import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Node } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventService } from '../../../services';
import { PointerLeaveEventListenerDirective } from './pointer-leave-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: PointerLeaveEventListenerDirective, inputs: ['eventTarget'] }],
})
class TestComponent {
  eventTarget = input<Node | null>(null);
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

  describe('when eventTarget is null', () => {
    it('should call eventService.handle with null as eventTarget', () => {
      const event = new Event('pointerleave');
      const spy = vi.spyOn(TestBed.inject(EventService), 'handle');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({ type: 'pointerleave', event, target: null });
    });
  });

  describe('when eventTarget is not null', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('eventTarget', { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} });
    });

    it('should call eventService.handle with eventTarget', () => {
      const event = new Event('pointerleave');
      const spy = vi.spyOn(TestBed.inject(EventService), 'handle');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({ type: 'pointerleave', event, target: component.eventTarget() });
    });
  });
});
