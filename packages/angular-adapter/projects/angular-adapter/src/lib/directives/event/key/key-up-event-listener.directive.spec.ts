import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventService } from '../../../services';
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

  it('should call eventService.handle', () => {
    const event = new KeyboardEvent('keyup');
    const spy = vi.spyOn(TestBed.inject(EventService), 'handle');

    document.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith({ type: 'keyup', event });
  });
});
