import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { mockNode } from '../../../test-utils';
import { CommandHandler } from '../../command-handler';
import { centerOnNode, centerOnRect } from '../centering';

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
    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: 0, height: 50 } });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if height is not defined', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: 50, height: 0 } });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if width is negative', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: -50, height: 50 } });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if height is negative', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: 50, height: -50 } });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if viewport dimensions are not defined', () => {
    flowCore.getState = vi.fn().mockReturnValue({
      metadata: {
        viewport: { x: 0, y: 0, scale: 1, width: undefined, height: undefined },
      },
    });

    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: 50, height: 50 } });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should center viewport on rect', () => {
    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: 50, height: 50 } });

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

    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: 50, height: 50 } });

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

    centerOnRect(commandHandler, { name: 'centerOnRect', rect: { x: 100, y: 100, width: 50, height: 50 } });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });
});

describe('centerOnNode command', () => {
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
      getNodeById: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  it('should not apply update if node is not found', () => {
    vi.spyOn(flowCore, 'getNodeById').mockReturnValue(null);

    centerOnNode(commandHandler, { name: 'centerOnNode', nodeOrId: 'node1' });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if node size is not defined', () => {
    const nodeWithoutSize = { ...mockNode, id: 'node1', size: undefined };
    vi.spyOn(flowCore, 'getNodeById').mockReturnValue(nodeWithoutSize);

    centerOnNode(commandHandler, { name: 'centerOnNode', nodeOrId: 'node1' });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should not apply update if viewport dimensions are not defined', () => {
    const node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } };
    vi.spyOn(flowCore, 'getNodeById').mockReturnValue(node);
    flowCore.getState = vi.fn().mockReturnValue({
      metadata: {
        viewport: { x: 0, y: 0, width: undefined, height: undefined },
      },
    });

    centerOnNode(commandHandler, { name: 'centerOnNode', nodeOrId: 'node1' });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });

  it('should center viewport on node when using node id', () => {
    const node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } };
    vi.spyOn(flowCore, 'getNodeById').mockReturnValue(node);

    centerOnNode(commandHandler, { name: 'centerOnNode', nodeOrId: 'node1' });

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
      'centerOnNode'
    );
  });

  it('should center viewport on node when passing node object directly', () => {
    const node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } };

    centerOnNode(commandHandler, { name: 'centerOnNode', nodeOrId: node });

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
      'centerOnNode'
    );
  });

  it('should apply scale to node center calculation', () => {
    const node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } };
    vi.spyOn(flowCore, 'getNodeById').mockReturnValue(node);
    flowCore.getState = vi.fn().mockReturnValue({
      metadata: {
        viewport: { x: 0, y: 0, scale: 2, width: 1000, height: 800 },
      },
    });

    centerOnNode(commandHandler, { name: 'centerOnNode', nodeOrId: 'node1' });

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
      'centerOnNode'
    );
  });

  it('should not apply update if new position is the same as current', () => {
    const node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 }, size: { width: 50, height: 50 } };
    vi.spyOn(flowCore, 'getNodeById').mockReturnValue(node);
    const currentX = 375; // Same as calculated position
    const currentY = 275;
    flowCore.getState = vi.fn().mockReturnValue({
      metadata: {
        viewport: { x: currentX, y: currentY, scale: 1, width: 1000, height: 800 },
      },
    });

    centerOnNode(commandHandler, { name: 'centerOnNode', nodeOrId: 'node1' });

    expect(flowCore.applyUpdate).not.toHaveBeenCalled();
  });
});
