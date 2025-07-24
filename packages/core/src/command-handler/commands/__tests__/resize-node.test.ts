import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import { CommandHandler } from '../../command-handler';
import { applyChildrenBoundsConstraints, MIN_NODE_SIZE, resizeNode } from '../resize-node';

// Mock the utils module properly for vitest
vi.mock('../../../utils', () => ({
  calculateGroupBounds: vi.fn(),
  isSameSize: vi.fn(),
}));

// Import the mocked functions after the mock is declared
import { calculateGroupBounds, isSameSize } from '../../../utils';
const mockCalculateGroupBounds = vi.mocked(calculateGroupBounds);
const mockIsSameSize = vi.mocked(isSameSize);

describe('Resize Node Command', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;

  beforeEach(() => {
    flowCore = {
      applyUpdate: vi.fn(),
      getNodeById: vi.fn(),
      modelLookup: {
        getNodeChildren: vi.fn(),
      },
    } as unknown as FlowCore;
    commandHandler = new CommandHandler(flowCore);

    // Reset mocks
    vi.clearAllMocks();
    mockIsSameSize.mockReturnValue(false); // Default to different sizes so resize proceeds
  });

  describe('resizeNode', () => {
    it('should not call applyUpdate if node is not found', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue(null);

      await expect(
        resizeNode(commandHandler, { name: 'resizeNode', id: '1', size: { width: 100, height: 100 } })
      ).rejects.toThrow('Node with id 1 not found.');

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should not call applyUpdate if new size is same as current size', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 50, height: MIN_NODE_SIZE + 50 },
      });

      // Mock isSameSize to return true for this test
      mockIsSameSize.mockReturnValue(true);

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 50, height: MIN_NODE_SIZE + 50 },
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should disable autoSize if disableAutoSize is true', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
        position: { x: 0, y: 0 },
        autoSize: true,
      });

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 200 }, // Using sizes above MIN_NODE_SIZE
        position: { x: 0, y: 0 },
        disableAutoSize: true,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 200 },
              autoSize: false,
              position: { x: 0, y: 0 },
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should not disable autoSize if disableAutoSize is false', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
        position: { x: 0, y: 0 },
        autoSize: true,
      });

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 200 }, // Using sizes above MIN_NODE_SIZE
        position: { x: 0, y: 0 },
        disableAutoSize: false,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 200 },
              position: { x: 0, y: 0 },
              autoSize: true,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should not disable autoSize if disableAutoSize is not provided', () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: 0, height: 0 },
        autoSize: true,
        position: { x: 0, y: 0 },
      });

      resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 200 }, // Using sizes above MIN_NODE_SIZE
        position: { x: 0, y: 0 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            { id: '1', size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 200 }, position: { x: 0, y: 0 } },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Single Node Resize with Size Constraints', () => {
    it('should enforce minimum width constraint', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE - 150, height: MIN_NODE_SIZE + 100 }, // width below minimum
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE + 100 },
              position: { x: 100, y: 100 },
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should enforce minimum height constraint', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE - 150 }, // height below minimum
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE },
              position: { x: 100, y: 100 },
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should enforce both width and height constraints', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE - 150, height: MIN_NODE_SIZE - 125 }, // both below minimum
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE },
              position: { x: 100, y: 100 },
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should not modify size when above minimum constraints', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 300 }, // both above minimum
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 300 },
              position: { x: 100, y: 100 },
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Position Adjustment for Size Constraints', () => {
    it('should adjust X position when width is constrained during left-edge resize', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      // Simulating left-edge resize where left edge is dragged right, making the top-left corner move right
      const requestedWidth = MIN_NODE_SIZE - 50; // This will be constrained to MIN_NODE_SIZE
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: requestedWidth, height: MIN_NODE_SIZE + 100 },
        position: { x: 250, y: 100 }, // position moved right from original (100) due to left edge moving right
      });

      const expectedXAdjustment = 250 - (MIN_NODE_SIZE - requestedWidth);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE + 100 },
              position: { x: expectedXAdjustment, y: 100 },
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should adjust Y position when height is constrained during top-edge resize', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      // Simulating top-edge resize where top edge is dragged down, making the top-left corner move down
      const requestedHeight = MIN_NODE_SIZE - 50; // This will be constrained to MIN_NODE_SIZE
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: requestedHeight },
        position: { x: 100, y: 250 }, // position moved down from original (100) due to top edge moving down
      });

      const expectedYAdjustment = 250 - (MIN_NODE_SIZE - requestedHeight);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE },
              position: { x: 100, y: expectedYAdjustment },
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should adjust both X and Y positions when both dimensions are constrained during top-left corner resize', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      const requestedWidth = MIN_NODE_SIZE - 50; // both constrained to MIN_NODE_SIZE
      const requestedHeight = MIN_NODE_SIZE - 50;
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: requestedWidth, height: requestedHeight },
        position: { x: 250, y: 250 }, // both positions moved right/down from original due to top-left corner drag
      });

      const expectedXAdjustment = 250 - (MIN_NODE_SIZE - requestedWidth);
      const expectedYAdjustment = 250 - (MIN_NODE_SIZE - requestedHeight);

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE },
              position: { x: expectedXAdjustment, y: expectedYAdjustment },
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should not adjust position when resizing from right/bottom edges', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      // Right/bottom edge resize - position stays the same (top-left corner doesn't move)
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE - 150, height: MIN_NODE_SIZE - 125 }, // both constrained
        position: { x: 100, y: 100 }, // position unchanged from original
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE },
              position: { x: 100, y: 100 }, // no position adjustment needed
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should not adjust position when size is not constrained', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      // Left/top resize but size is above minimum - no constraint, no adjustment needed
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE + 50, height: MIN_NODE_SIZE + 25 }, // above minimum
        position: { x: 150, y: 175 }, // position moved due to left/top edge drag
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE + 50, height: MIN_NODE_SIZE + 25 },
              position: { x: 150, y: 175 }, // no adjustment - size wasn't constrained
            },
          ],
        },
        'resizeNode'
      );
    });
  });

  describe('Undefined Position Handling', () => {
    it('should use original position when requested position is undefined', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 150, y: 250 },
        isGroup: false,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        size: { width: MIN_NODE_SIZE - 150, height: MIN_NODE_SIZE - 125 }, // both constrained
        // position is undefined - should use original position
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: '1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE },
              position: { x: 150, y: 250 }, // original position maintained
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should return early when command has no size', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: '1',
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 100 },
        position: { x: 100, y: 100 },
        isGroup: false,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: '1',
        // @ts-expect-error - testing invalid input
        size: undefined,
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Group Node Resize with Children Bounds Constraints', () => {
    it('should expand group width when children extend beyond requested bounds', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 100 }, // 400x300
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
      });

      // Mock children that extend beyond the requested group bounds
      const children = [
        { id: 'child1', position: { x: 120, y: 120 }, size: { width: 50, height: 50 } },
        { id: 'child2', position: { x: 450, y: 150 }, size: { width: 100, height: 60 } }, // extends to x=550
      ];
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue(children);

      // Mock calculateGroupBounds to return bounds that extend beyond requested size
      mockCalculateGroupBounds.mockReturnValue({
        minX: 120,
        minY: 120,
        maxX: 550, // extends beyond requested maxX of 450 (100 + 350)
        maxY: 210,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 150, height: MIN_NODE_SIZE + 50 }, // 350x250
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: MIN_NODE_SIZE + 250, height: MIN_NODE_SIZE + 50 }, // 450x250 - width expanded to contain children
              position: { x: 100, y: 100 },
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should expand group height when children extend beyond requested bounds', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 100 }, // 400x300
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
      });

      const children = [
        { id: 'child1', position: { x: 120, y: 120 }, size: { width: 50, height: 50 } },
        { id: 'child2', position: { x: 150, y: 380 }, size: { width: 60, height: 100 } }, // extends to y=480
      ];
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue(children);

      mockCalculateGroupBounds.mockReturnValue({
        minX: 120,
        minY: 120,
        maxX: 210,
        maxY: 480, // extends beyond requested maxY of 350 (100 + 250)
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 150, height: MIN_NODE_SIZE + 50 }, // 350x250
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: MIN_NODE_SIZE + 150, height: MIN_NODE_SIZE + 180 }, // 350x380 - height expanded to contain children
              position: { x: 100, y: 100 },
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should adjust group position when children extend beyond left/top edges', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 100 }, // 400x300
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
      });

      const children = [
        { id: 'child1', position: { x: 50, y: 60 }, size: { width: 100, height: 80 } }, // extends left and up
        { id: 'child2', position: { x: 200, y: 200 }, size: { width: 50, height: 50 } },
      ];
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue(children);

      mockCalculateGroupBounds.mockReturnValue({
        minX: 50, // extends left of requested minX of 100
        minY: 60, // extends above requested minY of 100
        maxX: 250,
        maxY: 250,
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 150, height: MIN_NODE_SIZE + 50 }, // 350x250
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 90 }, // 400x290 - expanded to contain all children
              position: { x: 50, y: 60 }, // position adjusted to contain children
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should handle complex case with children bounds affecting all dimensions', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 100 }, // 400x300
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
      });

      const children = [
        { id: 'child1', position: { x: 80, y: 90 }, size: { width: 50, height: 60 } }, // extends left and up
        { id: 'child2', position: { x: 450, y: 380 }, size: { width: 120, height: 150 } }, // extends right and down
      ];
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue(children);

      mockCalculateGroupBounds.mockReturnValue({
        minX: 80, // extends left of requested 100
        minY: 90, // extends up from requested 100
        maxX: 570, // extends right of requested 450 (100 + 350)
        maxY: 530, // extends down from requested 350 (100 + 250)
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 150, height: MIN_NODE_SIZE + 50 }, // 350x250
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: MIN_NODE_SIZE + 290, height: MIN_NODE_SIZE + 240 }, // 490x440 - expanded in both dimensions
              position: { x: 80, y: 90 }, // adjusted in both dimensions
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should apply minimum size constraints before children bounds constraints', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 100 }, // 400x300
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
      });

      const children = [{ id: 'child1', position: { x: 120, y: 120 }, size: { width: 50, height: 50 } }];
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue(children);

      mockCalculateGroupBounds.mockReturnValue({
        minX: 120,
        minY: 120,
        maxX: 170, // small children bounds
        maxY: 170,
      });

      // Request a size smaller than minimum
      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: MIN_NODE_SIZE - 100, height: MIN_NODE_SIZE - 50 }, // 100x150 - both smaller than MIN_NODE_SIZE
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE }, // minimum size applied
              position: { x: 100, y: 100 },
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should combine minimum size constraints with children bounds constraints', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 100 }, // 400x300
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
      });

      const children = [
        { id: 'child1', position: { x: 120, y: 120 }, size: { width: 50, height: 50 } },
        { id: 'child2', position: { x: 200, y: 350 }, size: { width: 100, height: 60 } }, // extends down to y=410
      ];
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue(children);

      mockCalculateGroupBounds.mockReturnValue({
        minX: 120,
        minY: 120,
        maxX: 300,
        maxY: 410, // children extend beyond minimum size constraints
      });

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        size: { width: MIN_NODE_SIZE - 50, height: MIN_NODE_SIZE - 20 }, // 150x180 - both smaller than MIN_NODE_SIZE, but children require more
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'group1',
              size: { width: MIN_NODE_SIZE, height: MIN_NODE_SIZE + 110 }, // 200x310 - width uses minimum, height uses children bounds
              position: { x: 100, y: 100 },
              autoSize: false,
            },
          ],
        },
        'resizeNode'
      );
    });

    it('should return early when group resize command has no size', async () => {
      (flowCore.getNodeById as ReturnType<typeof vi.fn>).mockReturnValue({
        id: 'group1',
        size: { width: MIN_NODE_SIZE + 200, height: MIN_NODE_SIZE + 100 }, // 400x300
        position: { x: 100, y: 100 },
        isGroup: true,
        selected: true,
      });

      const children = [{ id: 'child1', position: { x: 120, y: 120 }, size: { width: 50, height: 50 } }];
      (flowCore.modelLookup.getNodeChildren as ReturnType<typeof vi.fn>).mockReturnValue(children);

      await resizeNode(commandHandler, {
        name: 'resizeNode',
        id: 'group1',
        // @ts-expect-error - testing invalid input
        size: undefined,
        position: { x: 100, y: 100 },
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('applyChildrenBoundsConstraints', () => {
    it('should expand width when children extend beyond right edge', () => {
      const requestedSize = { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE }; // 300x200
      const requestedPosition = { x: 100, y: 100 };
      const childrenBounds = {
        minX: 120,
        minY: 120,
        maxX: MIN_NODE_SIZE + 250, // 450 - extends beyond requested maxX of 400 (100 + 300)
        maxY: 250,
      };

      const result = applyChildrenBoundsConstraints(requestedSize, requestedPosition, childrenBounds);

      expect(result).toEqual({
        size: { width: MIN_NODE_SIZE + 150, height: MIN_NODE_SIZE }, // 350x200 - width expanded from 300 to 350
        position: { x: 100, y: 100 },
      });
    });

    it('should expand height when children extend beyond bottom edge', () => {
      const requestedSize = { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE }; // 300x200
      const requestedPosition = { x: 100, y: 100 };
      const childrenBounds = {
        minX: 120,
        minY: 120,
        maxX: 350,
        maxY: MIN_NODE_SIZE + 150, // 350 - extends beyond requested maxY of 300 (100 + 200)
      };

      const result = applyChildrenBoundsConstraints(requestedSize, requestedPosition, childrenBounds);

      expect(result).toEqual({
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 50 }, // 300x250 - height expanded from 200 to 250
        position: { x: 100, y: 100 },
      });
    });

    it('should adjust position when children extend beyond left edge', () => {
      const requestedSize = { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE }; // 300x200
      const requestedPosition = { x: 100, y: 100 };
      const childrenBounds = {
        minX: 80, // extends left of requested minX of 100
        minY: 120,
        maxX: 350,
        maxY: 250,
      };

      const result = applyChildrenBoundsConstraints(requestedSize, requestedPosition, childrenBounds);

      expect(result).toEqual({
        size: { width: MIN_NODE_SIZE + 120, height: MIN_NODE_SIZE }, // 320x200 - width expanded to accommodate left extension
        position: { x: 80, y: 100 }, // position adjusted left
      });
    });

    it('should adjust position when children extend beyond top edge', () => {
      const requestedSize = { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE }; // 300x200
      const requestedPosition = { x: 100, y: 100 };
      const childrenBounds = {
        minX: 120,
        minY: 80, // extends above requested minY of 100
        maxX: 350,
        maxY: 250,
      };

      const result = applyChildrenBoundsConstraints(requestedSize, requestedPosition, childrenBounds);

      expect(result).toEqual({
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE + 20 }, // 300x220 - height expanded to accommodate top extension
        position: { x: 100, y: 80 }, // position adjusted up
      });
    });

    it('should expand in all directions when children extend beyond all edges', () => {
      const requestedSize = { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE }; // 300x200
      const requestedPosition = { x: 100, y: 100 };
      const childrenBounds = {
        minX: 80, // extends left
        minY: 90, // extends up
        maxX: MIN_NODE_SIZE + 250, // 450 - extends right
        maxY: MIN_NODE_SIZE + 150, // 350 - extends down
      };

      const result = applyChildrenBoundsConstraints(requestedSize, requestedPosition, childrenBounds);

      expect(result).toEqual({
        size: { width: MIN_NODE_SIZE + 170, height: MIN_NODE_SIZE + 60 }, // 370x260 - expanded in both dimensions
        position: { x: 80, y: 90 }, // adjusted in both dimensions
      });
    });

    it('should not modify bounds when children fit within requested bounds', () => {
      const requestedSize = { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE }; // 300x200
      const requestedPosition = { x: 100, y: 100 };
      const childrenBounds = {
        minX: 120, // within requested bounds
        minY: 120,
        maxX: 350, // within requested bounds (100 + 300 = 400)
        maxY: 250, // within requested bounds (100 + 200 = 300)
      };

      const result = applyChildrenBoundsConstraints(requestedSize, requestedPosition, childrenBounds);

      expect(result).toEqual({
        size: { width: MIN_NODE_SIZE + 100, height: MIN_NODE_SIZE }, // 300x200 - unchanged
        position: { x: 100, y: 100 }, // unchanged
      });
    });
  });
});
