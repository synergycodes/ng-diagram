import { CommandHandler, EnvironmentInfo, EventMapper } from '@angularflow/core';
import { describe, expect, it, vi } from 'vitest';
import { InputEventHandler } from '../../input-event-handler';
import { mockedNode, mockedPointerEvent } from '../../test-utils';
import { selectAction } from '../select';

describe('selectAction', () => {
  const environment: EnvironmentInfo = {
    os: 'windows',
    deviceType: 'desktop',
    browser: 'chrome',
  };
  const emit = vi.fn();
  const inputEventHandler = new InputEventHandler(
    {
      emit,
    } as unknown as CommandHandler,
    {
      register: vi.fn(),
    } as unknown as EventMapper,
    environment
  );

  describe('predicate', () => {
    it('should return true for pointerdown events', () => {
      expect(
        selectAction.predicate({ ...mockedPointerEvent, type: 'pointerdown' }, inputEventHandler, environment)
      ).toBe(true);
    });

    it('should return false for other events', () => {
      expect(
        selectAction.predicate({ ...mockedPointerEvent, type: 'pointerenter' }, inputEventHandler, environment)
      ).toBe(false);
      expect(selectAction.predicate({ ...mockedPointerEvent, type: 'pointerup' }, inputEventHandler, environment)).toBe(
        false
      );
    });
  });

  describe('action', () => {
    it('should emit deselectAll command when no target is provided', () => {
      selectAction.action({ ...mockedPointerEvent, target: null, type: 'pointerdown' }, inputEventHandler, environment);
      expect(emit).toHaveBeenCalledWith('deselectAll');
    });

    it('should emit select command when target is provided', () => {
      selectAction.action(
        { ...mockedPointerEvent, type: 'pointerdown', target: mockedNode },
        inputEventHandler,
        environment
      );
      expect(emit).toHaveBeenCalledWith('select', { ids: ['1'] });
    });
  });
});
