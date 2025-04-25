import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreCommandHandler } from '../command-handler';
import { FlowCore } from '../flow-core';
import { commands } from './index';
import { moveNodes } from './move-nodes';

const MOVEMENT_STEP = 10;

describe('Move Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CoreCommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CoreCommandHandler(flowCore, commands);
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

    moveNodes(commandHandler, { name: 'moveNodes', dx: MOVEMENT_STEP, dy: MOVEMENT_STEP });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodes: [
          {
            ...mockNode,
            position: { x: MOVEMENT_STEP, y: MOVEMENT_STEP },
          },
        ],
      },
      'moveNodes'
    );
  });

  it('should not move unselected nodes', () => {
    const mockNode = {
      id: '1',
      position: { x: 0, y: 0 },
      selected: false,
    };

    (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
      nodes: [mockNode],
    });

    moveNodes(commandHandler, { name: 'moveNodes', dx: MOVEMENT_STEP, dy: MOVEMENT_STEP });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        nodes: [mockNode],
      },
      'moveNodes'
    );
  });
});
