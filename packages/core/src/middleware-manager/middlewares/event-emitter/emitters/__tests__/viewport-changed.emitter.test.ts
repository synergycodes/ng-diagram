import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { ViewportChangedEvent } from '../../../../../event-manager/event-types';
import { mockMetadata } from '../../../../../test-utils';
import type { FlowState, MiddlewareContext, Viewport } from '../../../../../types';
import { ViewportChangedEmitter } from '../viewport-changed.emitter';

describe('ViewportChangedEmitter', () => {
  let emitter: ViewportChangedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  const createViewport = (x: number, y: number, scale: number): Viewport => ({
    x,
    y,
    scale,
    width: 800,
    height: 600,
  });

  const createState = (viewport: Viewport): FlowState => ({
    nodes: [],
    edges: [],
    metadata: {
      ...mockMetadata,
      viewport,
    },
  });

  beforeEach(() => {
    emitter = new ViewportChangedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    const initialViewport = createViewport(0, 0, 1);
    const currentViewport = createViewport(0, 0, 1);

    context = {
      initialState: createState(initialViewport),
      state: createState(currentViewport),
    } as unknown as MiddlewareContext;
  });

  it('should not emit event when viewport has not changed', () => {
    const viewport = createViewport(100, 200, 1.5);
    context.initialState = createState(viewport);
    context.state = createState(viewport);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit event when viewport x position changes', () => {
    const initialViewport = createViewport(100, 200, 1);
    const newViewport = createViewport(150, 200, 1);

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event when viewport y position changes', () => {
    const initialViewport = createViewport(100, 200, 1);
    const newViewport = createViewport(100, 250, 1);

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event when viewport scale changes', () => {
    const initialViewport = createViewport(100, 200, 1);
    const newViewport = createViewport(100, 200, 2);

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event when multiple viewport properties change', () => {
    const initialViewport = createViewport(100, 200, 1);
    const newViewport = createViewport(300, 400, 2.5);

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event with negative viewport values', () => {
    const initialViewport = createViewport(0, 0, 1);
    const newViewport = createViewport(-100, -200, 0.5);

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should handle minimal change in viewport position', () => {
    const initialViewport = createViewport(100, 200, 1);
    const newViewport = createViewport(100.0001, 200, 1);

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should handle minimal change in viewport scale', () => {
    const initialViewport = createViewport(100, 200, 1);
    const newViewport = createViewport(100, 200, 1.0001);

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event when viewport width changes', () => {
    const initialViewport: Viewport = { x: 100, y: 200, scale: 1, width: 800, height: 600 };
    const newViewport: Viewport = { x: 100, y: 200, scale: 1, width: 1000, height: 600 };

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event when viewport height changes', () => {
    const initialViewport: Viewport = { x: 100, y: 200, scale: 1, width: 800, height: 600 };
    const newViewport: Viewport = { x: 100, y: 200, scale: 1, width: 800, height: 700 };

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event when both width and height change', () => {
    const initialViewport: Viewport = { x: 100, y: 200, scale: 1, width: 800, height: 600 };
    const newViewport: Viewport = { x: 100, y: 200, scale: 1, width: 1000, height: 700 };

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });

  it('should emit event when all viewport properties change', () => {
    const initialViewport: Viewport = { x: 100, y: 200, scale: 1, width: 800, height: 600 };
    const newViewport: Viewport = { x: 300, y: 400, scale: 2, width: 1200, height: 900 };

    context.initialState = createState(initialViewport);
    context.state = createState(newViewport);

    emitter.emit(context, eventManager);

    const expectedEvent: ViewportChangedEvent = {
      viewport: newViewport,
      previousViewport: initialViewport,
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('viewportChanged', expectedEvent);
  });
});
