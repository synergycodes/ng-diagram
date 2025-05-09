import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockMetadata } from '../../../test-utils';
import { CommandHandler } from '../../command-handler';
import { moveViewport, moveViewportBy } from '../move-viewport';

const MOVEMENT_STEP = 10;

describe('Move Viewport Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('moveViewportBy', () => {
    it('should move viewport by the specified amount', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        metadata: mockMetadata,
      });

      moveViewportBy(commandHandler, { name: 'moveViewportBy', x: MOVEMENT_STEP, y: MOVEMENT_STEP });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            ...mockMetadata,
            viewport: {
              ...mockMetadata.viewport,
              x: mockMetadata.viewport.x + MOVEMENT_STEP,
              y: mockMetadata.viewport.y + MOVEMENT_STEP,
            },
          },
        },
        'moveViewport'
      );
    });

    it('should not call applyUpdate if x and y are 0', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        metadata: mockMetadata,
      });

      moveViewportBy(commandHandler, { name: 'moveViewportBy', x: 0, y: 0 });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('moveViewport', () => {
    it('should move viewport to the specified coordinates', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        metadata: mockMetadata,
      });

      moveViewport(commandHandler, { name: 'moveViewport', x: 100, y: 100 });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            ...mockMetadata,
            viewport: {
              ...mockMetadata.viewport,
              x: 100,
              y: 100,
            },
          },
        },
        'moveViewport'
      );
    });

    it('should not call applyUpdate if x and y are the same as the current viewport', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        metadata: mockMetadata,
      });

      moveViewport(commandHandler, {
        name: 'moveViewport',
        x: mockMetadata.viewport.x,
        y: mockMetadata.viewport.y,
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });
});
