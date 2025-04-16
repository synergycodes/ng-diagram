import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreCommandInterpreter } from './command-interpreter';
import type { SystemEvent } from './types/command-interpreter.interface';

describe('CoreCommandInterpreter', () => {
    let interpreter: CoreCommandInterpreter;

    beforeEach(() => {
        interpreter = new CoreCommandInterpreter();
    });

    describe('emit', () => {
        it('should call all registered callbacks for the event type', () => {
            const commandCallback = vi.fn();
            const modelChangeCallback = vi.fn();
            const otherCommandCallback = vi.fn();

            interpreter.register('command', commandCallback);
            interpreter.register('modelChange', modelChangeCallback);
            interpreter.register('command', otherCommandCallback);

            const commandEvent: SystemEvent = { type: 'command', name: 'test' };
            interpreter.emit(commandEvent);

            expect(commandCallback).toHaveBeenCalledWith(commandEvent);
            expect(otherCommandCallback).toHaveBeenCalledWith(commandEvent);
            expect(modelChangeCallback).not.toHaveBeenCalled();
        });

        it('should not call any callbacks if none are registered for the event type', () => {
            const callback = vi.fn();
            interpreter.register('modelChange', callback);

            const commandEvent: SystemEvent = { type: 'command', name: 'test' };
            interpreter.emit(commandEvent);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('register', () => {
        it('should allow registering multiple callbacks for the same event type', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            interpreter.register('command', callback1);
            interpreter.register('command', callback2);

            const event: SystemEvent = { type: 'command', name: 'test' };
            interpreter.emit(event);

            expect(callback1).toHaveBeenCalledWith(event);
            expect(callback2).toHaveBeenCalledWith(event);
        });

        it('should allow registering the same callback multiple times', () => {
            const callback = vi.fn();

            interpreter.register('command', callback);
            interpreter.register('command', callback);

            const event: SystemEvent = { type: 'command', name: 'test' };
            interpreter.emit(event);

            expect(callback).toHaveBeenCalledTimes(2);
        });

        it('should preserve callback order', () => {
            const calls: string[] = [];
            const callback1 = () => calls.push('1');
            const callback2 = () => calls.push('2');

            interpreter.register('command', callback1);
            interpreter.register('command', callback2);

            interpreter.emit({ type: 'command', name: 'test' });

            expect(calls).toEqual(['1', '2']);
        });
    });

    describe('unregister', () => {
        it('should remove the callback when unregister is called', () => {
            const callback = vi.fn();
            const unregister = interpreter.register('command', callback);

            unregister();
            interpreter.emit({ type: 'command', name: 'test' });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should only remove the specific callback that was unregistered', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            const unregister1 = interpreter.register('command', callback1);
            interpreter.register('command', callback2);

            unregister1();
            interpreter.emit({ type: 'command', name: 'test' });

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });

        it('should remove the event type from the map when no callbacks remain', () => {
            const callback = vi.fn();
            const unregister = interpreter.register('command', callback);

            unregister();
            interpreter.emit({ type: 'command', name: 'test' });

            // @ts-expect-error - accessing private property for testing
            expect(interpreter.callbacks.has('command')).toBe(false);
        });

        it('should handle unregistering a callback that was already removed', () => {
            const callback = vi.fn();
            const unregister = interpreter.register('command', callback);

            unregister();
            unregister(); // Call again, should not throw

            interpreter.emit({ type: 'command', name: 'test' });
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('event data', () => {
        it('should pass command event data to callbacks', () => {
            const callback = vi.fn();
            interpreter.register('command', callback);

            const eventData = { some: 'data' };
            interpreter.emit({ type: 'command', name: 'test', data: eventData });

            expect(callback).toHaveBeenCalledWith({
                type: 'command',
                name: 'test',
                data: eventData
            });
        });

        it('should pass model change event data to callbacks', () => {
            const callback = vi.fn();
            interpreter.register('modelChange', callback);

            const eventData = { some: 'data' };
            interpreter.emit({ type: 'modelChange', action: 'update', data: eventData });

            expect(callback).toHaveBeenCalledWith({
                type: 'modelChange',
                action: 'update',
                data: eventData
            });
        });
    });
});
