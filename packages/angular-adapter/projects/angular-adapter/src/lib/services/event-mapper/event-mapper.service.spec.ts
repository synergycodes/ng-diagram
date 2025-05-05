import { TestBed } from '@angular/core/testing';
import { Event } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { EventMapperService } from './event-mapper.service';

describe('EventMapperService', () => {
  let service: EventMapperService;

  beforeEach(() => {
    service = TestBed.inject(EventMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should register event listener', () => {
      const listener = vi.fn();
      service.register(listener);

      const event: Event = { type: 'pointerdown', x: 10, y: 10, pressure: 1, timestamp: 1000, target: null };
      service.emit(event);

      expect(listener).toHaveBeenCalledWith(event);
    });

    it('should register multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.register(listener1);
      service.register(listener2);

      const event: Event = { type: 'pointerdown', x: 10, y: 10, pressure: 1, timestamp: 1000, target: null };
      service.emit(event);

      expect(listener1).toHaveBeenCalledWith(event);
      expect(listener2).toHaveBeenCalledWith(event);
    });
  });

  describe('emit', () => {
    it('should not throw when no listeners registered', () => {
      expect(() => {
        service.emit({ type: 'pointerdown', x: 10, y: 10, pressure: 1, timestamp: 1000, target: null });
      }).not.toThrow();
    });

    it('should call all registered listeners with event', () => {
      const listeners = [vi.fn(), vi.fn(), vi.fn()];
      listeners.forEach((listener) => service.register(listener));

      const event: Event = { type: 'pointerdown', x: 10, y: 10, pressure: 1, timestamp: 1000, target: null };
      service.emit(event);

      listeners.forEach((listener) => {
        expect(listener).toHaveBeenCalledWith(event);
      });
    });
  });
});
