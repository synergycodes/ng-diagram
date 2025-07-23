import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import { CutEventHandler } from './cut.handler';

describe('CutEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: CutEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
    instance = new CutEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit cut command', () => {
      instance.handle();

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('cut');
    });
  });
});
