import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Node } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventService } from '../../../services';
import { PointerEnterEventListenerDirective } from './pointer-enter-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: PointerEnterEventListenerDirective, inputs: ['eventTarget'] }],
})
class TestComponent {
  eventTarget = input<Node | null>(null);
}

describe('PointerEnterEventListenerDirective', () => {
  let component: TestComponent;
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerEnterEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    directive = fixture.debugElement.injector.get(PointerEnterEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('when eventTarget is null', () => {
    it('should call eventService.handle with null as eventTarget', () => {
      const event = new Event('pointerenter');
      const spy = vi.spyOn(TestBed.inject(EventService), 'handle');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({ type: 'pointerenter', event, target: null });
    });
  });

  describe('when eventTarget is not null', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('eventTarget', { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} });
    });

    it('should call eventService.handle with eventTarget', () => {
      const event = new Event('pointerenter');
      const spy = vi.spyOn(TestBed.inject(EventService), 'handle');

      fixture.debugElement.nativeElement.dispatchEvent(event);

      expect(spy).toHaveBeenCalledWith({ type: 'pointerenter', event, target: component.eventTarget() });
    });
  });
});
