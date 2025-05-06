import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { EventTarget } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { PointerMoveEventListenerDirective } from './pointer-move-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [PointerMoveEventListenerDirective],
})
class TestComponent {
  eventTarget = input<EventTarget | null>(null);
}

describe('PointerMoveEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerMoveEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(PointerMoveEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call stopPropagation method on the event', () => {
    const event = new Event('pointermove');
    const spy = vi.spyOn(event, 'stopPropagation');

    fixture.debugElement.nativeElement.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
  });

  it('should call eventMapperService.emit', () => {
    const event = new Event('pointermove');
    Object.assign(event, { pressure: 0, clientX: 10, clientY: 10 });
    const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

    fixture.debugElement.nativeElement.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith({
      type: 'pointermove',
      target: null,
      pressure: 0,
      timestamp: expect.any(Number),
      x: 10,
      y: 10,
    });
  });
});
