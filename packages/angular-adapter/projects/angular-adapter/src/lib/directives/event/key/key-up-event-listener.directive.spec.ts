import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { KeyUpEventListenerDirective } from './key-up-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: KeyUpEventListenerDirective }],
})
class TestComponent {}

describe('KeyUpEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: KeyUpEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(KeyUpEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call eventMapperService.emit', () => {
    const event = new KeyboardEvent('keyup', { key: 'K', code: 'KeyK' });
    const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

    document.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith({
      type: 'keyup',
      target: null,
      timestamp: expect.any(Number),
      key: 'K',
      code: 'KeyK',
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
    });
  });
});
