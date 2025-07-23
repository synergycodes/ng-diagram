import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { PasteEvent } from './paste.event';
import { PasteEventHandler } from './paste.handler';

const getMockEvent = (): PasteEvent => ({
  name: 'paste',
  id: 'test-id',
  timestamp: Date.now(),
  modifiers: {
    primary: false,
    secondary: false,
    shift: false,
    meta: false,
  },
});

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
    it('should emit paste command without position', () => {
      const event = getMockEvent();
      handler.handle({
        ...event,
      });

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste', {});
    });

    it('should emit paste command with position', () => {
      const point = { x: 100, y: 200 };
      handler.handle({
        ...getMockEvent(),
        lastInputPoint: point,
      });

      expect(mockCommandHandler.emit).toHaveBeenCalledWith('paste', { position: point });
    });
  });
});
