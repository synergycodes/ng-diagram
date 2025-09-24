import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockEnvironment } from '../../../test-utils';
import { DeleteSelectionEventHandler } from './delete-selection.handler';

describe('DeleteSelectionEventHandler', () => {
  const mockCommandHandler = { emit: vi.fn() };
  let mockFlowCore: FlowCore;
  let instance: DeleteSelectionEventHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFlowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      commandHandler: mockCommandHandler,
      environment: mockEnvironment,
    } as unknown as FlowCore;
    instance = new DeleteSelectionEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit deleteSelection command', () => {
      instance.handle();

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('deleteSelection');
    });
  });
});
