import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { FlowState } from '../../../types';
import { CommandHandler } from '../../command-handler';
import { init } from '../init';

describe('init command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;
  const mockState: FlowState = { nodes: [], edges: [], metadata: { viewport: { x: 0, y: 0, scale: 1 } } };

  beforeEach(() => {
    flowCore = {
      getState: vi.fn().mockReturnValue(mockState),
      setState: vi.fn(),
      applyUpdate: vi.fn(),
      middlewareManager: { execute: vi.fn().mockReturnValue(mockState) },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should execute init command on middlewares with current state', () => {
    init(commandHandler);

    expect(commandHandler.flowCore.getState).toHaveBeenCalled();
    expect(flowCore.middlewareManager.execute).toHaveBeenCalledWith(mockState, mockState, 'init');
    expect(commandHandler.flowCore.setState).toHaveBeenCalledWith(mockState);
  });
});
