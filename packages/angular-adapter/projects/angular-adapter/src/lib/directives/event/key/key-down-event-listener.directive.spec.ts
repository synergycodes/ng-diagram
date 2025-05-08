import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { KeyDownEventListenerDirective } from './key-down-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: KeyDownEventListenerDirective }],
})
class TestComponent {}

describe('KeyDownEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: KeyDownEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(KeyDownEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call eventMapperService.emit', () => {
    const event = new KeyboardEvent('keydown', { key: 'K', code: 'KeyK' });
    const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

    document.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith({
      type: 'keydown',
      target: { type: 'diagram' },
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
