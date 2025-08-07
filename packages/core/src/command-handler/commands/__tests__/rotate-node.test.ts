import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../flow-core';
import type { Node } from '../../../types/node.interface';
import { CommandHandler } from '../../command-handler';
import { rotateNodeTo } from '../rotate-node';

describe('rotateNodeTo', () => {
  let flowCore: FlowCore;
  let commandHandler: CommandHandler;
  let mockNode: Node;

  beforeEach(() => {
    mockNode = {
      id: 'node1',
      position: { x: 100, y: 100 },
      size: { width: 100, height: 50 },
      angle: 0,
      data: {},
    };

    flowCore = {
      applyUpdate: vi.fn(),
      getNodeById: vi.fn().mockReturnValue(mockNode),
      config: {
        nodeRotation: {
          shouldSnapForNode: () => false,
          computeSnapAngleForNode: () => 15,
          defaultSnapAngle: 15,
        },
      },
    } as unknown as FlowCore;

    commandHandler = new CommandHandler(flowCore);
  });

  describe('basic rotation without snapping', () => {
    it('should rotate node to specified angle', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 45,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 45,
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should normalize angles greater than 360', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 380,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 20, // 380 normalized to 20
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should normalize negative angles', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: -45,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 315, // -45 normalized to 315
            },
          ],
        },
        'rotateNodeTo'
      );
    });
  });

  describe('rotation with snapping', () => {
    beforeEach(() => {
      flowCore.config.nodeRotation.shouldSnapForNode = () => true;
    });

    it('should snap angle to nearest snap point', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 47,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 45, // 47 snapped to 45 (with snap angle of 15)
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should use custom snap angle from computeSnapAngleForNode', async () => {
      flowCore.config.nodeRotation.computeSnapAngleForNode = () => 30;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 35,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 30, // 35 snapped to 30 (with snap angle of 30)
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should use default snap angle when computeSnapAngleForNode returns null', async () => {
      flowCore.config.nodeRotation.computeSnapAngleForNode = () => null;
      flowCore.config.nodeRotation.defaultSnapAngle = 45;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 50,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 45, // 50 snapped to 45 (with snap angle of 45)
            },
          ],
        },
        'rotateNodeTo'
      );
    });
  });

  describe('early returns', () => {
    it('should not update when node does not exist', async () => {
      vi.mocked(flowCore.getNodeById).mockReturnValue(null);

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'nonexistent',
        angle: 45,
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should not update when angle is same as current angle', async () => {
      mockNode.angle = 45;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 45,
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should not update when snapped angle equals current angle', async () => {
      flowCore.config.nodeRotation.shouldSnapForNode = () => true;
      mockNode.angle = 45;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 47, // Will snap to 45, which equals current
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should treat undefined angle as 0 for comparison', async () => {
      mockNode.angle = undefined;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 0,
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle node with undefined angle', async () => {
      mockNode.angle = undefined;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 90,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 90,
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should handle angle of 0', async () => {
      mockNode.angle = 90;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 0,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 0,
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should handle angle of 360 (normalizes to 0)', async () => {
      mockNode.angle = 90;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 360,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 0,
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should handle very large angles', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 725, // 725 = 360 * 2 + 5
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 5,
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should handle very negative angles', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: -725, // -725 = -360 * 2 - 5
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 355,
            },
          ],
        },
        'rotateNodeTo'
      );
    });
  });

  describe('conditional snapping', () => {
    it('should respect shouldSnapForNode returning false for specific nodes', async () => {
      flowCore.config.nodeRotation.shouldSnapForNode = (node) => node.id !== 'node1';

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 47,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 47, // Not snapped
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should apply snapping when shouldSnapForNode returns true', async () => {
      flowCore.config.nodeRotation.shouldSnapForNode = (node) => node.id === 'node1';

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 47,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 45, // Snapped
            },
          ],
        },
        'rotateNodeTo'
      );
    });
  });
});
