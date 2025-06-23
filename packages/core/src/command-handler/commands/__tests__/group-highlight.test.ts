import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { highlightGroup, highlightGroupClear } from '../highlight-group';

describe('Highlight Group Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('highlightGroup', () => {
    it('should highlight a new group and unhighlight previous', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'oldGroup' } });

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'newGroup' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadataUpdate: { highlightedGroup: 'newGroup' },
          nodesToUpdate: [
            { id: 'newGroup', highlighted: true },
            { id: 'oldGroup', highlighted: false },
          ],
        },
        'highlightGroup'
      );
    });

    it('should highlight a group when no previous group is highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: null } });

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadataUpdate: { highlightedGroup: 'group1' },
          nodesToUpdate: [{ id: 'group1', highlighted: true }],
        },
        'highlightGroup'
      );
    });

    it('should do nothing if the group is already highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'group1' } });

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1' });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('highlightGroupClear', () => {
    it('should clear highlight if a group is highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'group1' } });

      await highlightGroupClear(commandHandler);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadataUpdate: { highlightedGroup: null },
          nodesToUpdate: [{ id: 'group1', highlighted: false }],
        },
        'highlightGroupClear'
      );
    });

    it('should do nothing if no group is highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: null } });

      await highlightGroupClear(commandHandler);

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });
});
