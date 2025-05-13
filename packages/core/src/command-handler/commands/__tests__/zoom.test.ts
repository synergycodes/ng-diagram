import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { zoom } from '../zoom';

describe('zoom command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 1 } } }),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should not apply update if viewport values are unchanged', () => {
    zoom(commandHandler, { name: 'zoom', x: 0, y: 0, scale: 1 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should apply update with new viewport values', () => {
    zoom(commandHandler, { name: 'zoom', x: 100, y: 200, scale: 2 });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith({ metadata: { viewport: { x: 100, y: 200, scale: 2 } } }, 'zoom');
  });
});
