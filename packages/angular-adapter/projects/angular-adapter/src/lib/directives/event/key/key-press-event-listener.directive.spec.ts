import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventService } from '../../../services';
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

  it('should call eventService.handle', () => {
    const event = new KeyboardEvent('keypress');
    const spy = vi.spyOn(TestBed.inject(EventService), 'handle');

    document.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith({ type: 'keypress', event });
  });
});
