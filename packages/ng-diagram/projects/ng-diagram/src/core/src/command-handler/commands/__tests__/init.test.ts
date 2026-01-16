import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { mockMetadata } from '../../../test-utils';
import { FlowState } from '../../../types';
import { CommandHandler } from '../../command-handler';
import { init, InitCommand } from '../init';

describe('init command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;
  const mockState: FlowState = { nodes: [], edges: [], metadata: mockMetadata };

  beforeEach(() => {
    flowCore = {
      getState: vi.fn().mockReturnValue(mockState),
      setState: vi.fn(),
      applyUpdate: vi.fn(),
      middlewareManager: { execute: vi.fn().mockReturnValue(mockState) },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should execute init command on middlewares', async () => {
    const command: InitCommand = { name: 'init' };
    await init(commandHandler, command);

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { renderedNodeIds: undefined, renderedEdgeIds: undefined },
      'init'
    );
  });

  it('should pass rendered IDs when provided', async () => {
    const command: InitCommand = {
      name: 'init',
      renderedNodeIds: ['node1', 'node2'],
      renderedEdgeIds: ['edge1'],
    };
    await init(commandHandler, command);

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { renderedNodeIds: ['node1', 'node2'], renderedEdgeIds: ['edge1'] },
      'init'
    );
  });
});
