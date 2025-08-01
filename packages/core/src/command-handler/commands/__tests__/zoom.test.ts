import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { zoom } from '../zoom';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;

describe('zoom command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn().mockReturnValue({ metadata: { viewport: { x: 0, y: 0, scale: 1 } } }),
      applyUpdate: vi.fn(),
      config: {
        zoom: {
          min: MIN_ZOOM,
          max: MAX_ZOOM,
        },
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should not apply update if viewport values are unchanged', () => {
    zoom(commandHandler, { name: 'zoom', x: 0, y: 0, scale: 1 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should apply update with new viewport values', () => {
    zoom(commandHandler, { name: 'zoom', x: 100, y: 200, scale: 2 });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      { metadataUpdate: { viewport: { x: 100, y: 200, scale: 2 } } },
      'zoom'
    );
  });

  it('should not apply zoom if it is below config.zoom.min', () => {
    zoom(commandHandler, { name: 'zoom', x: 100, y: 200, scale: MIN_ZOOM - 0.01 });
    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply zoom if it is above config.zoom.max', () => {
    zoom(commandHandler, { name: 'zoom', x: 100, y: 200, scale: MAX_ZOOM + 0.01 });
    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });
});
