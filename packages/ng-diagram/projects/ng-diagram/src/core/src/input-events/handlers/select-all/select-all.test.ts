import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { SelectAllEventHandler } from './select-all.handler';

describe('SelectAllEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: SelectAllEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      commandHandler: mockCommandHandler,
    } as unknown as FlowCore;

    instance = new SelectAllEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit selectAll command', () => {
      instance.handle();

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('selectAll');
    });
  });
});
