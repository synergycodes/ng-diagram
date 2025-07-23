import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { PasteEventHandler } from './paste.handler';

describe('PasteEventHandler', () => {
  let handler: PasteEventHandler;
  let mockFlowCore: FlowCore;
  const mockCommandHandler = { emit: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFlowCore = {
      commandHandler: mockCommandHandler,
    } as unknown as FlowCore;

    handler = new PasteEventHandler(mockFlowCore);
  });

  describe('handle', () => {
    it('should emit paste command', () => {
      // TODO: Fix me
      handler.handle({
        name: 'paste',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste');
    });
  });
});
