import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { resizeNode } from '../resize-node';

describe('Resize Node Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      applyUpdate: vi.fn(),
      getNodeById: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('resizeNode', () => {
    it('should not call applyUpdate if node is not found', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(null);

      resizeNode(commandHandler, { name: 'resizeNode', id: '1', size: { width: 100, height: 100 } });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should not call applyUpdate if new size is same as current size', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 100, height: 100 },
      });

      resizeNode(commandHandler, { name: 'resizeNode', id: '1', size: { width: 100, height: 100 } });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should resize node by the specified amount', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
      });

      resizeNode(commandHandler, { name: 'resizeNode', id: '1', size: { width: 100, height: 100 } });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: '1', size: { width: 100, height: 100 } }],
        },
        'resizeNode'
      );
    });

    it('should update position if position is provided', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
        position: { x: 0, y: 0 },
      });

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 100, height: 100 },
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        { nodesToUpdate: [{ id: '1', size: { width: 100, height: 100 }, position: { x: 100, y: 100 } }] },
        'resizeNode'
      );
    });

    it('should disable autoSize if disableAutoSize is true', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
        autoSize: true,
      });

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 100, height: 100 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: '1', size: { width: 100, height: 100 }, autoSize: false }],
        },
        'resizeNode'
      );
    });

    it('should not disable autoSize if disableAutoSize is false', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
        autoSize: true,
      });

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 100, height: 100 },
        disableAutoSize: false,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: '1', size: { width: 100, height: 100 }, autoSize: true }],
        },
        'resizeNode'
      );
    });

    it('should not disable autoSize if disableAutoSize is not provided', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
        autoSize: true,
      });

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 100, height: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: '1', size: { width: 100, height: 100 } }],
        },
        'resizeNode'
      );
    });
  });
});
