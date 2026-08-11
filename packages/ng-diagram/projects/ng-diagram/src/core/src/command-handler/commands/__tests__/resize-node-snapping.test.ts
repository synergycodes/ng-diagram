import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import type { GroupNode } from '../../../types/node.interface';
import { CommandHandler } from '../../command-handler';
import { resizeNode } from '../resize-node';

// Mock the utils module
vi.mock('../../../utils', () => ({
  calculateGroupBounds: vi.fn(),
  isSameSize: vi.fn().mockReturnValue(false),
  isGroup: vi.fn(),
}));

import { calculateGroupBounds, isGroup } from '../../../utils';
const mockCalculateGroupBounds = vi.mocked(calculateGroupBounds);
const mockIsGroup = vi.mocked(isGroup);

describe('Resize Node Command with Snapping', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  const MIN_WIDTH = 100;
  const MIN_HEIGHT = 100;
  const SNAP_GRID = { width: 10, height: 10 };

  beforeEach(() => {
    flowCore = {
      applyUpdate: vi.fn(),
      getNodeById: vi.fn(),
      modelLookup: {
        getNodeChildren: vi.fn(),
      },
      config: {
        resize: {
          getMinNodeSize: vi.fn().mockReturnValue({ width: MIN_WIDTH, height: MIN_HEIGHT }),
        },
        snapping: {
          shouldSnapDragForNode: vi.fn().mockReturnValue(false),
          shouldSnapResizeForNode: vi.fn().mockReturnValue(true), // Enable snapping
          computeSnapForNodeSize: vi.fn().mockReturnValue(SNAP_GRID),
          computeSnapOffsetForNodeSize: vi.fn().mockReturnValue(null),
          defaultResizeSnap: SNAP_GRID,
          defaultResizeSnapOffset: { width: 0, height: 0 },
        },
      },
      transactionManager: {
        isActive: vi.fn().mockReturnValue(false),
        getCurrentTransaction: vi.fn(),
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);

    vi.clearAllMocks();
  });

  describe('Regular Node Snapping', () => {
    it('should snap size when resizing from bottom-right corner', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 253, height: 187 }, // Not aligned to grid
        position: { x: 100, y: 100 }, // Position unchanged (bottom-right resize)
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 250, height: 190 }, // Snapped to 10px grid
              position: { x: 100, y: 100 },
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should calculate size from snapped position when resizing from left edge', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // When resizing from left, position moves and size changes
      // Original right edge: 100 + 200 = 300
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 147, height: 200 }, // Smaller width
        position: { x: 153, y: 100 }, // Position moved right (left edge dragged right)
        disableAutoSize: true,
      });

      // Position snaps to 150 (nearest 10)
      // Width should be calculated to maintain right edge at 300: 300 - 150 = 150
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 150, height: 200 }, // Calculated from snapped position
              position: { x: 150, y: 100 }, // Snapped position
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should calculate size from snapped position when resizing from top edge', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // When resizing from top, position moves and size changes
      // Original bottom edge: 100 + 200 = 300
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 147 }, // Smaller height
        position: { x: 100, y: 153 }, // Position moved down (top edge dragged down)
        disableAutoSize: true,
      });

      // Position snaps to 150 (nearest 10)
      // Height should be calculated to maintain bottom edge at 300: 300 - 150 = 150
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 150 }, // Calculated from snapped position
              position: { x: 100, y: 150 }, // Snapped position
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should handle top-left corner resize with both position and size snapping', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // Original right edge: 300, bottom edge: 300
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 147, height: 137 },
        position: { x: 153, y: 163 }, // Both x and y moved
        disableAutoSize: true,
      });

      // Position snaps to 150, 160
      // Width: 300 - 150 = 150, Height: 300 - 160 = 140
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 150, height: 140 }, // Calculated from snapped positions
              position: { x: 150, y: 160 }, // Snapped positions
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should snap size normally when position does not move', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // Right edge resize - position stays the same
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 253, height: 187 },
        disableAutoSize: true,
        // No position provided - stays at original
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 250, height: 190 }, // Snapped normally
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Group Node Snapping', () => {
    it('should apply same snapping logic to groups as regular nodes', async () => {
      const groupNode: GroupNode = {
        id: 'group1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
        highlighted: false,
      } as GroupNode;
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      mockIsGroup.mockReturnValue(true);

      // Mock children within bounds
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'child1', position: { x: 120, y: 120 }, size: { width: 50, height: 50 } },
      ]);
      mockCalculateGroupBounds.mockReturnValue({
        left: 120,
        top: 120,
        right: 170,
        bottom: 170,
      });

      // Resize from left edge
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 147, height: 200 },
        position: { x: 153, y: 100 },
        disableAutoSize: true,
      });

      // Children bounds constraints are applied
      // Group must contain children from 120,120 to 170,170
      // Requested position 153 snaps to 150, but children min is 120
      // Final position: min(150, 120) = 120
      // Final width: max(170, 150+150) - 120 = 180
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 180, height: 200 }, // Adjusted for children bounds
              position: { x: 120, y: 100 }, // Adjusted to contain children
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should handle group resize from top-left with children bounds and snapping', async () => {
      const groupNode: GroupNode = {
        id: 'group1',
        size: { width: 300, height: 300 },
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
        highlighted: false,
      } as GroupNode;
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      mockIsGroup.mockReturnValue(true);

      // Mock children that extend the bounds
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'child1', position: { x: 120, y: 120 }, size: { width: 100, height: 100 } },
        { id: 'child2', position: { x: 250, y: 250 }, size: { width: 100, height: 100 } },
      ]);
      mockCalculateGroupBounds.mockReturnValue({
        left: 120,
        top: 120,
        right: 350,
        bottom: 350,
      });

      // Resize from top-left corner
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 247, height: 237 },
        position: { x: 153, y: 163 },
        disableAutoSize: true,
      });

      // Position snaps to 150, 160
      // Width calculated from snapped position: 400 - 150 = 250
      // Height calculated from snapped position: 400 - 160 = 240
      // But children bounds require group to extend from 120,120 to 350,350
      // Final bounds must include both requested bounds and children bounds
      // left = min(150, 120) = 120
      // top = min(160, 120) = 120
      // right = max(150+250, 350) = max(400, 350) = 400
      // bottom = max(160+240, 350) = max(400, 350) = 400
      // Final size: width = 400-120 = 280, height = 400-120 = 280
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 280, height: 280 }, // Expanded to contain calculated bounds and children
              position: { x: 120, y: 120 }, // Adjusted to contain children
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should prevent jittering when resizing group from left with snapping', async () => {
      const groupNode: GroupNode = {
        id: 'group1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
        highlighted: false,
      } as GroupNode;
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      mockIsGroup.mockReturnValue(true);

      // No children
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

      // Simulate small incremental resize from left (this was causing jittering)
      // User drags left edge slightly to the right
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 198, height: 200 }, // Slightly smaller
        position: { x: 102, y: 100 }, // Slightly moved right
        disableAutoSize: true,
      });

      // Position snaps to 100 (nearest 10)
      // Since position didn't actually change after snapping, width should snap normally
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 200, height: 200 }, // Snapped to grid
              position: { x: 100, y: 100 }, // Snapped position (unchanged)
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should not move a group with children when resizing from bottom-right (position unchanged)', async () => {
      // Regression: a group whose position is not aligned to the resize snap grid
      // must stay anchored when resized from an edge that does not move its
      // top-left corner. Previously the group path always synthesized a position,
      // which then got snapped to the grid and made the group jump.
      const groupNode: GroupNode = {
        id: 'group1',
        size: { width: 200, height: 150 },
        position: { x: 137, y: 84 }, // Deliberately off the snap grid
        isGroup: true,
        selected: true,
        highlighted: false,
      } as GroupNode;
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      mockIsGroup.mockReturnValue(true);

      // One child fully inside the group
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue([
        { id: 'child1', position: { x: 160, y: 100 }, size: { width: 40, height: 30 } },
      ]);
      mockCalculateGroupBounds.mockReturnValue({ left: 160, top: 100, right: 200, bottom: 130 });

      // Custom resize snap grid, matching the reported configuration
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });

      // Resize from bottom-right corner: no position is provided by the handler
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 240, height: 170 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 200, height: 150 }, // 240 -> 200, 170 -> 150 (snapped)
              position: { x: 137, y: 84 }, // Preserved - the group must not move
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should handle group resize from top edge with snapping correctly', async () => {
      const groupNode: GroupNode = {
        id: 'group1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
        highlighted: false,
      } as GroupNode;
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(groupNode);
      mockIsGroup.mockReturnValue(true);

      // No children
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue([]);

      // Resize from top edge
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 200, height: 147 },
        position: { x: 100, y: 153 }, // Top edge moved down
        disableAutoSize: true,
      });

      // Position snaps to 150, height calculated from snapped position
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 200, height: 150 }, // Height calculated: 300 - 150 = 150
              position: { x: 100, y: 150 }, // Snapped position
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Resize Snap Offset', () => {
    it('snaps size to the sequence offset + n * snap (header + min height use case)', async () => {
      // A node with a 60px header / 60px min height, snapping every 50px vertically.
      // The next snapped height after 60 should be 110 (60 + 50), not 100.
      const node = {
        id: '1',
        size: { width: 200, height: 60 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 100, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });
      (flowCore.config.snapping.computeSnapOffsetForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 0,
        height: 60,
      });

      // Resize from the bottom edge: only height changes, no position provided.
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 95 }, // Would snap to 100 without the offset
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 110 }, // 60 + 50, thanks to the offset
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('falls back to defaultResizeSnapOffset when computeSnapOffsetForNodeSize returns null', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 60 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 100, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });
      (flowCore.config.snapping.computeSnapOffsetForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue(null);
      flowCore.config.snapping.defaultResizeSnapOffset = { width: 0, height: 60 };

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 95 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 110 }, // Uses the default offset
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('keeps the bottom edge fixed and lands the height on the offset grid when resizing from the top edge', async () => {
      // Bottom edge is fixed at y = 100 + 110 = 210, so with offset 60 and snap 50
      // the valid positions are 210 - (60 + n * 50) = ..., 0, 50, 100, 150 and the
      // resulting heights land on 60, 110, 160, ...
      const node = {
        id: '1',
        size: { width: 200, height: 110 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 100, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });
      (flowCore.config.snapping.computeSnapOffsetForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 0,
        height: 60,
      });

      // Drag the top edge from y=100 up to y=70 (height 110 -> 140)
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 140 },
        position: { x: 100, y: 70 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 160 }, // 60 + 2 * 50 — on the offset grid
              position: { x: 100, y: 50 }, // 210 - 160 — bottom edge unchanged
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('keeps the right edge fixed and lands the width on the offset grid when resizing from the left edge', async () => {
      // Right edge is fixed at x = 100 + 200 = 300, so with offset 60 and snap 100
      // the valid positions are 300 - (60 + n * 100) = ..., 40, 140, 240 and the
      // resulting widths land on 60, 160, 260, ...
      const node = {
        id: '1',
        size: { width: 200, height: 110 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 60, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });
      (flowCore.config.snapping.computeSnapOffsetForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 60,
        height: 0,
      });

      // Drag the left edge from x=100 to x=120 (width 200 -> 180)
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 180, height: 110 },
        position: { x: 120, y: 100 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 160, height: 110 }, // 60 + 100 — on the offset grid
              position: { x: 140, y: 100 }, // 300 - 160 — right edge unchanged
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Minimum Size After Snapping', () => {
    it('bumps a snapped size below the minimum up to the next snap increment', async () => {
      // Min height 60, snap 50: resizing to 70 used to snap DOWN to 50, below the
      // minimum — it must land on the next valid increment instead (100).
      const node = {
        id: '1',
        size: { width: 200, height: 60 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 100, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });

      // Resize from the bottom edge: no position provided
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 70 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 100 }, // Next increment >= min, not 50
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('keeps the bottom edge fixed when the minimum bump happens on a top-edge resize', async () => {
      // Bottom edge fixed at y = 210. Snapping the dragged top edge would give
      // height 50 < min 60, so the height bumps to 100 and the position moves
      // back to 210 - 100 = 110 to keep the bottom edge in place.
      const node = {
        id: '1',
        size: { width: 200, height: 110 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 100, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });

      // Drag the top edge from y=100 down to y=140 (height 110 -> 70)
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 70 },
        position: { x: 100, y: 140 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 100 },
              position: { x: 100, y: 110 }, // 210 - 100 — bottom edge unchanged
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('does not let a collapse past the fixed edge escape the grid when the minimum is 0', async () => {
      // With min 0 and an offset that is not a multiple of the snap, the
      // phase-snapped position can land past the fixed bottom edge (300); the
      // derived height clamps to 0, which is not below a 0 minimum. The bump
      // must still fire: height goes to the smallest grid value (30) and the
      // position is pulled back to 300 - 30 = 270.
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 0, height: 0 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 50,
        height: 50,
      });
      (flowCore.config.snapping.computeSnapOffsetForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 30,
        height: 30,
      });

      // Drag the top edge almost to the bottom edge (height 200 -> 3)
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 3 },
        position: { x: 100, y: 297 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 30 }, // smallest value on the 30 + n*50 grid
              position: { x: 100, y: 270 }, // 300 - 30 — never past the fixed edge
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('snaps a left-edge nudge on a node at an off-grid minimum up to the next valid increment', async () => {
      // The node sits at its 60px minimum, which is not on the 50px grid. Any
      // left-edge drag must land the width on the grid at or above the minimum
      // (100), with the right edge staying fixed — consistent with how a
      // bottom/right nudge behaves on the same node.
      const node = {
        id: '1',
        size: { width: 60, height: 60 },
        position: { x: 0, y: 0 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 60, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 50,
        height: 50,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 59.6, height: 60 },
        position: { x: 0.4, y: 0 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 100, height: 60 }, // next grid value >= min
              position: { x: -40, y: 0 }, // 60 - 100 — right edge stays at 60
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Children Bounds After Snapping', () => {
    const group = {
      id: 'group1',
      size: { width: 300, height: 300 },
      position: { x: 100, y: 100 },
      isGroup: true,
      selected: true,
      highlighted: false,
    } as GroupNode;

    beforeEach(() => {
      mockIsGroup.mockReturnValue(true);
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue([{ id: 'child1' }]);
    });

    it('bumps a snapped-down width back up so the children stay contained', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(group);
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 100,
      });
      // Children reach x=540; the requested width is expanded to contain them (440),
      // but the 100px grid would round it down to 400 and cut them by 40px
      mockCalculateGroupBounds.mockReturnValue({ left: 120, top: 120, right: 540, bottom: 280 });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 430, height: 300 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 500, height: 300 }, // next grid value containing the children, not 400
              position: { x: 100, y: 100 },
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('keeps the children contained when they push the position during a bottom-right resize', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        ...group,
        size: { width: 200, height: 150 },
        position: { x: 137, y: 84 },
      });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 10,
        height: 10,
      });
      // Children stick out past the LEFT edge (x=93), so containment moves the
      // position; the phase-snapped position must not land inside the children
      mockCalculateGroupBounds.mockReturnValue({ left: 93, top: 100, right: 360, bottom: 200 });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 240, height: 170 },
        disableAutoSize: true,
      });

      // The right edge stays anchored at 337, so children reaching x=360 remain
      // uncovered on that side — a separate, pre-existing limitation (NGD-291)
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 250, height: 170 }, // >= 337 - 93 = 244, on the grid
              position: { x: 87, y: 84 }, // 337 - 250 — left of the children
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('bumps a top-edge resize over the children instead of cutting them', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        ...group,
        size: { width: 200, height: 200 },
      });
      (flowCore.config.resize.getMinNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({ width: 100, height: 60 });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });
      (flowCore.config.snapping.computeSnapOffsetForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 0,
        height: 60,
      });
      // Children start at y=135, just above where the snapped top edge would land
      mockCalculateGroupBounds.mockReturnValue({ left: 120, top: 135, right: 280, bottom: 280 });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 200, height: 140 },
        position: { x: 100, y: 160 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 200, height: 210 }, // on the 60 + n*50 sequence, >= 300 - 135
              position: { x: 100, y: 90 }, // 300 - 210 — above the children
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('ignores children minimums when containment is disabled (infinite bounds)', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        ...group,
        size: { width: 200, height: 150 },
        position: { x: 137, y: 84 },
      });
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue({
        width: 100,
        height: 50,
      });
      // allowResizeBelowChildrenBounds: true reports inverted infinite bounds
      mockCalculateGroupBounds.mockReturnValue({
        left: Infinity,
        top: Infinity,
        right: -Infinity,
        bottom: -Infinity,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: 240, height: 170 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: 200, height: 150 }, // plain snap, no children influence
              position: { x: 137, y: 84 },
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle resize when node has no initial size', async () => {
      const node = {
        id: '1',
        position: { x: 100, y: 100 },
        // No size property
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // Spy on commandHandler.emit
      const emitSpy = vi.spyOn(commandHandler, 'emit');

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 150 },
      });

      // Should emit updateNode instead of using applyUpdate
      expect(emitSpy).toHaveBeenCalledWith('updateNode', {
        id: '1',
        nodeChanges: {
          size: { width: 200, height: 150 },
        },
      });
    });

    it('should handle zero height when resizing from top edge with snapping', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 100 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // Resize from top edge, dragging it down past the bottom edge
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: -50 }, // Negative height
        position: { x: 100, y: 250 }, // Position moved way down
        disableAutoSize: true,
      });

      // With minimum size constraint, height will be 100
      // Position will be constrained as well
      // Original bottom edge: 100 + 100 = 200
      // Requested position 250 would mean negative height, but min is 100
      // Position adjustment: 250 - (100 - (-50)) = 100
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 100 }, // Min height applied
              position: { x: 100, y: 100 }, // Position adjusted for min constraint
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should not apply snapping when disabled', async () => {
      // Disable snapping
      (flowCore.config.snapping.shouldSnapResizeForNode as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 253, height: 187 }, // Not aligned to grid
        position: { x: 107, y: 93 }, // Not aligned to grid
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 253, height: 187 }, // Not snapped
              position: { x: 107, y: 93 }, // Not snapped
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should handle resizing when position moves but size stays same for width', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // Only height changes, but position x moves (edge case)
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 200, height: 150 }, // Width unchanged
        position: { x: 105, y: 100 }, // X position changed but width didn't
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 200, height: 150 }, // Width stays same, height snapped
              position: { x: 110, y: 100 }, // X position snapped
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should handle different snap grid sizes', async () => {
      // Use different snap grid
      const customSnap = { width: 25, height: 15 };
      (flowCore.config.snapping.computeSnapForNodeSize as ReturnType<typeof vi.fn>).mockReturnValue(customSnap);

      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 213, height: 187 },
        position: { x: 100, y: 100 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 225, height: 180 }, // Width snapped to 25, height to 15
              position: { x: 100, y: 100 }, // Position preserved - neither axis moved
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Integration with Minimum Size Constraints', () => {
    it('should apply minimum size before snapping calculations', async () => {
      const node = {
        id: '1',
        size: { width: 200, height: 200 },
        position: { x: 100, y: 100 },
      };
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(node);
      mockIsGroup.mockReturnValue(false);

      // Try to resize below minimum from left edge
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: 50, height: 200 }, // Below minimum width of 100
        position: { x: 250, y: 100 }, // Position moved right
        disableAutoSize: true,
      });

      // Width constrained to 100, position adjusted back
      // Adjusted position: 250 - (100 - 50) = 200
      // Then position snaps to 200 (already on grid)
      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: 100, height: 200 }, // Minimum width applied, then calculated from snap
              position: { x: 200, y: 100 }, // Adjusted and snapped
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });
  });
});
