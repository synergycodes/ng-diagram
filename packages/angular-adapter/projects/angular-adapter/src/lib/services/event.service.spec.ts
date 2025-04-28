import { TestBed } from '@angular/core/testing';
import { Edge, Node } from '@angularflow/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Event } from '../types';
import { EventService } from './event.service';

describe('EventService', () => {
  let service: EventService;

  beforeEach(() => {
    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handle', () => {
    const mockPointerEvent = {} as PointerEvent;
    const mockNode: Node = { id: '1', type: 'test', position: { x: 0, y: 0 }, data: {} };
    const mockEdge: Edge = { id: '1', source: '1', target: '2', data: {} };

    describe('unknown event', () => {
      it('should throw an error', () => {
        const event = { type: 'unknown' } as unknown as Event;

        expect(() => service.handle(event)).toThrow();
      });
    });

    describe.each<Event>([
      { type: 'pointerdown', event: mockPointerEvent, target: mockNode },
      { type: 'pointerup', event: mockPointerEvent, target: mockEdge },
      { type: 'pointermove', event: mockPointerEvent },
      { type: 'pointerenter', event: mockPointerEvent, target: mockNode },
      { type: 'pointerleave', event: mockPointerEvent, target: mockNode },
    ])('should call log $type event to the console', (event) => {
      it('should call log pointerdown and received event to the console', () => {
        const spy = vi.spyOn(console, 'log');

        service.handle(event);

        expect(spy).toHaveBeenCalledWith(event.type, event);
      });
    });
  });
});
