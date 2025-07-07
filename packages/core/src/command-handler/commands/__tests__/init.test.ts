import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { mockMetadata } from '../../../test-utils';
import { FlowState } from '../../../types';
import { CommandHandler } from '../../command-handler';
import { init } from '../init';

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

  it('should execute init command on middlewares', () => {
    init(commandHandler);

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({}, 'init');
  });
});
