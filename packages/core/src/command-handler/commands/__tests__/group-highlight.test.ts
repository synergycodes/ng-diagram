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
      modelLookup: {
        getNodeById: vi.fn(),
      },
      config: {
        grouping: {
          canGroup: vi.fn(),
        },
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);
  });

  describe('highlightGroup', () => {
    it('should highlight a new group and unhighlight previous', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];
      const groupNode = { id: 'newGroup', type: 'group', position: { x: 0, y: 0 }, data: {} };

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'oldGroup' } });
      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'newGroup', nodes: testNodes });

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
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];
      const groupNode = { id: 'group1', type: 'group', position: { x: 0, y: 0 }, data: {} };

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: null } });
      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          metadataUpdate: { highlightedGroup: 'group1' },
          nodesToUpdate: [{ id: 'group1', highlighted: true }],
        },
        'highlightGroup'
      );
    });

    it('should do nothing if the group is already highlighted', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: 'group1' } });

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing if the group does not exist', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: null } });
      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'nonexistent', nodes: testNodes });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing if no nodes can be grouped', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];
      const groupNode = { id: 'group1', type: 'group', position: { x: 0, y: 0 }, data: {} };

      (flowCore.getState as ReturnType<typeof vi.fn>).mockReturnValue({ metadata: { highlightedGroup: null } });
      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

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
