import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandHandler } from '../../command-handler';
import { FlowCore } from '../../flow-core';
import { mockedMetadata } from '../../test-utils';
import { moveViewport, moveViewportBy } from '../move-viewport';

const MOVEMENT_STEP = 10;

describe('Move Viewport Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CoreCommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CoreCommandHandler(flowCore);
  });

  describe('moveViewportBy', () => {
    it('should move viewport by the specified amount', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        metadata: mockedMetadata,
      });

      moveViewportBy(commandHandler, { name: 'moveViewportBy', x: MOVEMENT_STEP, y: MOVEMENT_STEP });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            ...mockedMetadata,
            viewport: {
              ...mockedMetadata.viewport,
              x: mockedMetadata.viewport.x + MOVEMENT_STEP,
              y: mockedMetadata.viewport.y + MOVEMENT_STEP,
            },
          },
        },
        'moveViewport'
      );
    });

    it('should not call applyUpdate if x and y are 0', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        metadata: mockedMetadata,
      });

      moveViewportBy(commandHandler, { name: 'moveViewportBy', x: 0, y: 0 });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('moveViewport', () => {
    it('should move viewport to the specified coordinates', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        metadata: mockedMetadata,
      });

      moveViewport(commandHandler, { name: 'moveViewport', x: 100, y: 100 });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadata: {
            ...mockedMetadata,
            viewport: {
              ...mockedMetadata.viewport,
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
        metadata: mockedMetadata,
      });

      moveViewport(commandHandler, {
        name: 'moveViewport',
        x: mockedMetadata.viewport.x,
        y: mockedMetadata.viewport.y,
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });
});
