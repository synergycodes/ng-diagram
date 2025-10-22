import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { centerOnRect } from '../center-on-rect';

describe('centerOnRect command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn().mockReturnValue({
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 1000, height: 800 },
        },
      }),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should not apply update if width is not defined', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: 0, height: 50 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if height is not defined', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: 50, height: 0 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if width is negative', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: -50, height: 50 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if height is negative', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: 50, height: -50 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if viewport dimensions are not defined', () => {
    flowCore.getState = vi.fn().mockReturnValue({
      metadata: {
        viewport: { x: 0, y: 0, scale: 1, width: undefined, height: undefined },
      },
    });

    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: 50, height: 50 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should center viewport on rect', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: 50, height: 50 });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        metadataUpdate: {
          viewport: {
            x: 375, // (1000/2) - ((100 + 50/2) * 1)
            y: 275, // (800/2) - ((100 + 50/2) * 1)
            scale: 1,
            width: 1000,
            height: 800,
          },
        },
      },
      'centerOnRect'
    );
  });

  it('should apply scale to rect center calculation', () => {
    flowCore.getState = vi.fn().mockReturnValue({
      metadata: {
        viewport: { x: 0, y: 0, scale: 2, width: 1000, height: 800 },
      },
    });

    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: 50, height: 50 });

    expect(flowCore.applyUpdate).toHaveBeenCalledWith(
      {
        metadataUpdate: {
          viewport: {
            x: 250, // (1000/2) - ((100 + 50/2) * 2)
            y: 150, // (800/2) - ((100 + 50/2) * 2)
            scale: 2,
            width: 1000,
            height: 800,
          },
        },
      },
      'centerOnRect'
    );
  });

  it('should not apply update if new position is the same as current', () => {
    const currentX = 375; // Same as calculated position
    const currentY = 275;
    flowCore.getState = vi.fn().mockReturnValue({
      metadata: {
        viewport: { x: currentX, y: currentY, scale: 1, width: 1000, height: 800 },
      },
    });

    centerOnRect(commandHandler, { name: 'centerOnRect', x: 100, y: 100, width: 50, height: 50 });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });
});
