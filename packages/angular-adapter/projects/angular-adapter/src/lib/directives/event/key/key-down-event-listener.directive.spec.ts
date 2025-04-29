import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventService } from '../../../services';
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

  it('should call eventService.handle', () => {
    const event = new KeyboardEvent('keydown');
    const spy = vi.spyOn(TestBed.inject(EventService), 'handle');

    document.dispatchEvent(event);

    expect(spy).toHaveBeenCalledWith({ type: 'keydown', event });
  });
});
