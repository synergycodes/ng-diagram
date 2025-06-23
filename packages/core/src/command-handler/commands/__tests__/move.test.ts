import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { moveNodesBy } from '../move';

const MOVEMENT_STEP = 10;

describe('Move Selection Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
      modelLookup: {
        getSelectedNodesWithChildren: vi.fn().mockReturnValue([{ id: '1', position: { x: 0, y: 0 }, selected: true }]),
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should move selected nodes by the specified amount', () => {
    const mockNode = {
      id: '1',
      position: { x: 0, y: 0 },
      selected: true,
      data: {},
      type: 'node',
    };

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [mockNode],
    });

    moveNodesBy(commandHandler, {
      name: 'moveNodesBy',
      delta: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
      nodes: [mockNode],
    });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodesToUpdate: [
          {
            id: mockNode.id,
            position: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
          },
        ],
      },
      'moveNodesBy'
    );
  });

  it('should not apply update if no nodes are selected', () => {
    const mockNode = {
      id: '1',
      position: { x: 0, y: 0 },
      selected: false,
      data: {},
      type: 'node',
    };

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [mockNode],
    });

    (flowCore.modelLookup.getSelectedNodesWithChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

    moveNodesBy(commandHandler, {
      name: 'moveNodesBy',
      delta: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
      nodes: [],
    });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });
});
