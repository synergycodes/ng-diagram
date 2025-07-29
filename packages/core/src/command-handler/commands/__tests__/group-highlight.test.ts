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

    highlightGroupClear(commandHandler);

    (flowCore.applyUpdate as ReturnType<typeof vi.fn>).mockClear();
  });

  describe('highlightGroup', () => {
    it('should highlight a new group and unhighlight previous', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];
      const oldGroupNode = { id: 'oldGroup', type: 'group', position: { x: 0, y: 0 }, data: {} };
      const newGroupNode = { id: 'newGroup', type: 'group', position: { x: 0, y: 0 }, data: {} };

      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(oldGroupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(true);
      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'oldGroup', nodes: testNodes });

      (flowCore.applyUpdate as ReturnType<typeof vi.fn>).mockClear();

      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(newGroupNode);
      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'newGroup', nodes: testNodes });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
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

      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(true);

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: 'group1', highlighted: true }],
        },
        'highlightGroup'
      );
    });

    it('should do nothing if the group is already highlighted', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];
      const groupNode = { id: 'group1', type: 'group', position: { x: 0, y: 0 }, data: {} };

      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(true);
      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

      (flowCore.applyUpdate as ReturnType<typeof vi.fn>).mockClear();

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing if the group does not exist', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];

      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'nonexistent', nodes: testNodes });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should do nothing if no nodes can be grouped', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];
      const groupNode = { id: 'group1', type: 'group', position: { x: 0, y: 0 }, data: {} };

      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(false);

      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('highlightGroupClear', () => {
    it('should clear highlight if a group is highlighted', async () => {
      const testNodes = [{ id: 'node1', type: 'rectangle', position: { x: 0, y: 0 }, data: {} }];
      const groupNode = { id: 'group1', type: 'group', position: { x: 0, y: 0 }, data: {} };
      (flowCore.modelLookup.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      (flowCore.config.grouping.canGroup as ReturnType<typeof vi.fn>).mockReturnValue(true);
      await highlightGroup(commandHandler, { name: 'highlightGroup', groupId: 'group1', nodes: testNodes });

      (flowCore.applyUpdate as ReturnType<typeof vi.fn>).mockClear();

      await highlightGroupClear(commandHandler);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [{ id: 'group1', highlighted: false }],
        },
        'highlightGroupClear'
      );
    });

    it('should do nothing if no group is highlighted', async () => {
      await highlightGroupClear(commandHandler);

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });
});
