import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { resizeNode } from '../resize-node';

describe('Resize Node Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('resizeNode', () => {
    it('should not call applyUpdate if node is not found', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: [],
      });

      resizeNode(commandHandler, { name: 'resizeNode', id: '1', size: { width: 100, height: 100 } });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should not call applyUpdate if new size is same as current size', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: [{ id: '1', size: { width: 100, height: 100 } }],
      });

      resizeNode(commandHandler, { name: 'resizeNode', id: '1', size: { width: 100, height: 100 } });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should resize node by the specified amount', () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({
        nodes: [{ id: '1', size: { width: 0, height: 0 } }],
      });

      resizeNode(commandHandler, { name: 'resizeNode', id: '1', size: { width: 100, height: 100 } });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodes: [
            {
              id: '1',
              size: { width: 100, height: 100 },
            },
          ],
        },
        'resizeNode'
      );
    });
  });
});
