import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { PointerMoveEventListenerDirective } from './pointer-move-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [PointerMoveEventListenerDirective],
})
class TestComponent {}

describe('PointerMoveEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: PointerMoveEventListenerDirective;
  let mockEvent: Event;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(PointerMoveEventListenerDirective);
    fixture.detectChanges();
  });

  beforeEach(() => {
    mockEvent = new Event('pointermove');
    Object.assign(mockEvent, { pressure: 0, clientX: 10, clientY: 10 });
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call eventMapperService.emit', () => {
    const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

    fixture.debugElement.nativeElement.dispatchEvent(mockEvent);

    expect(spy).toHaveBeenCalledWith({
      type: 'pointermove',
      target: { type: 'diagram' },
      pressure: 0,
      timestamp: expect.any(Number),
      x: 10,
      y: 10,
    });
  });
});
