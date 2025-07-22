import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import { CopyEventHandler } from './copy.handler';

describe('CopyEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: CopyEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
    instance = new CopyEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit copy command', () => {
      instance.handle();

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('copy');
    });
  });
});
