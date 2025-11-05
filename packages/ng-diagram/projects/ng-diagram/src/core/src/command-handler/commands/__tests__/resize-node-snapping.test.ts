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
          defaultResizeSnap: SNAP_GRID,
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
        minX: 120,
        minY: 120,
        maxX: 170,
        maxY: 170,
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
        minX: 120,
        minY: 120,
        maxX: 350,
        maxY: 350,
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
      // minX = min(150, 120) = 120
      // minY = min(160, 120) = 120
      // maxX = max(150+250, 350) = max(400, 350) = 400
      // maxY = max(160+240, 350) = max(400, 350) = 400
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
              position: { x: 100, y: 105 }, // Y position adjusted due to height constraint
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
