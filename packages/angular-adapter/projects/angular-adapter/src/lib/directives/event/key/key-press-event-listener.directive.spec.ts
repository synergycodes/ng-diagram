import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from '../../../services';
import { KeyPressEventListenerDirective } from './key-press-event-listener.directive';

@Component({
  template: '',
  hostDirectives: [{ directive: KeyPressEventListenerDirective }],
})
class TestComponent {}

describe('KeyPressEventListenerDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let directive: KeyPressEventListenerDirective;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestComponent] }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    directive = fixture.debugElement.injector.get(KeyPressEventListenerDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  it('should call eventMapperService.emit', () => {
    const event = new KeyboardEvent('keypress', { key: 'K', code: 'KeyK' });
    const spy = vi.spyOn(TestBed.inject(EventMapperService), 'emit');

    document.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith({
      type: 'keypress',
      target: null,
      timestamp: expect.any(Number),
      key: 'K',
      code: 'KeyK',
    });
  });
});
