import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandHandler } from '../command-handler';
import { FlowCore } from '../flow-core';
import { moveSelection } from './move-selection';

const MOVEMENT_STEP = 10;

describe('Move Selection Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CoreCommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CoreCommandHandler(flowCore);
  });

  it('should move selected nodes by the specified amount', () => {
    const mockNode = {
      id: '1',
      position: { x: 0, y: 0 },
      selected: true,
    };

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [mockNode],
    });

    moveSelection(commandHandler, { name: 'moveSelection', dx: MOVEMENT_STEP, dy: MOVEMENT_STEP });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodes: [
          {
            ...mockNode,
            position: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
          },
        ],
      },
      'moveSelection'
    );
  });

  it('should not apply update if no nodes are selected', () => {
    const mockNode = {
      id: '1',
      position: { x: 0, y: 0 },
      selected: false,
    };

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [mockNode],
    });

    moveSelection(commandHandler, { name: 'moveSelection', dx: MOVEMENT_STEP, dy: MOVEMENT_STEP });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });
});
