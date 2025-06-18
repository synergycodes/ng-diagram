import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { groupHighlight, groupHighlightClear } from '../group-highlight';

describe('Group Highlight Commands', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      getState: vi.fn(),
      applyUpdate: vi.fn(),
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('groupHighlight', () => {
    it('should highlight a new group and unhighlight previous', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'oldGroup' } });

      await groupHighlight(commandHandler, { name: 'groupHighlight', groupId: 'newGroup' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadataUpdate: { highlightedGroup: 'newGroup' },
          nodesToUpdate: [
            { id: 'newGroup', highlighted: true },
            { id: 'oldGroup', highlighted: false },
          ],
        },
        'groupHighlight'
      );
    });

    it('should highlight a group when no previous group is highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: null } });

      await groupHighlight(commandHandler, { name: 'groupHighlight', groupId: 'group1' });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadataUpdate: { highlightedGroup: 'group1' },
          nodesToUpdate: [{ id: 'group1', highlighted: true }],
        },
        'groupHighlight'
      );
    });

    it('should do nothing if the group is already highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'group1' } });

      await groupHighlight(commandHandler, { name: 'groupHighlight', groupId: 'group1' });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('groupHighlightClear', () => {
    it('should clear highlight if a group is highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'group1' } });

      await groupHighlightClear(commandHandler);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadataUpdate: { highlightedGroup: null },
          nodesToUpdate: [{ id: 'group1', highlighted: false }],
        },
        'groupHighlightClear'
      );
    });

    it('should do nothing if no group is highlighted', async () => {
      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: null } });

      await groupHighlightClear(commandHandler);

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });
});
