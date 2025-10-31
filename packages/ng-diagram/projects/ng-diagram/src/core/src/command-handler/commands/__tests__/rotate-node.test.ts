import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../../../flow-core';
import type { Node } from '../../../types/node.interface';
import { CommandHandler } from '../../command-handler';
import { MICRO_SNAP_THRESHOLD, microSnapToCardinal, rotateNodeTo } from '../rotate-node';

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

  describe('microsnapping to cardinal angles', () => {
    it('should microsnap angles close to 0°', async () => {
      mockNode.angle = 45;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: MICRO_SNAP_THRESHOLD,
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

    it('should microsnap angles close to 360° to 0°', async () => {
      mockNode.angle = 45;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 360 - MICRO_SNAP_THRESHOLD,
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

    it('should microsnap angles close to 90°', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 90 + MICRO_SNAP_THRESHOLD - 1,
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

    it('should microsnap angles close to 180°', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 180 - MICRO_SNAP_THRESHOLD + 1,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 180,
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should microsnap angles close to 270°', async () => {
      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 270 + MICRO_SNAP_THRESHOLD,
      });

      expect(flowCore.applyUpdate).toHaveBeenCalledWith(
        {
          nodesToUpdate: [
            {
              id: 'node1',
              angle: 270,
            },
          ],
        },
        'rotateNodeTo'
      );
    });

    it('should not microsnap angles far from cardinal angles', async () => {
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

    it('should apply microsnapping even when regular snapping is disabled', async () => {
      flowCore.config.nodeRotation.shouldSnapForNode = () => false;
      mockNode.angle = 45;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: 360 - MICRO_SNAP_THRESHOLD,
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

    it('should NOT apply microsnapping when regular snapping is enabled', async () => {
      flowCore.config.nodeRotation.shouldSnapForNode = () => true;
      flowCore.config.nodeRotation.defaultSnapAngle = 15;
      mockNode.angle = 10;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: MICRO_SNAP_THRESHOLD,
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

    it('should not update when microsnap results in current angle', async () => {
      mockNode.angle = 0;

      await rotateNodeTo(commandHandler, {
        name: 'rotateNodeTo',
        nodeId: 'node1',
        angle: MICRO_SNAP_THRESHOLD,
      });

      expect(flowCore.applyUpdate).not.toHaveBeenCalled();
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

describe('microSnapToCardinal', () => {
  describe('snapping to cardinal angles', () => {
    it('should snap angles within threshold of 0°', () => {
      expect(microSnapToCardinal(0)).toBe(0);
      expect(microSnapToCardinal(MICRO_SNAP_THRESHOLD - 1)).toBe(0);
      expect(microSnapToCardinal(MICRO_SNAP_THRESHOLD)).toBe(0);
    });

    it('should snap angles within threshold of 90°', () => {
      expect(microSnapToCardinal(90 - MICRO_SNAP_THRESHOLD)).toBe(90);
      expect(microSnapToCardinal(90 - MICRO_SNAP_THRESHOLD + 1)).toBe(90);
      expect(microSnapToCardinal(90)).toBe(90);
      expect(microSnapToCardinal(90 + MICRO_SNAP_THRESHOLD - 1)).toBe(90);
      expect(microSnapToCardinal(90 + MICRO_SNAP_THRESHOLD)).toBe(90);
    });

    it('should snap angles within threshold of 180°', () => {
      expect(microSnapToCardinal(180 - MICRO_SNAP_THRESHOLD)).toBe(180);
      expect(microSnapToCardinal(180 - MICRO_SNAP_THRESHOLD + 1)).toBe(180);
      expect(microSnapToCardinal(180)).toBe(180);
      expect(microSnapToCardinal(180 + MICRO_SNAP_THRESHOLD - 1)).toBe(180);
      expect(microSnapToCardinal(180 + MICRO_SNAP_THRESHOLD)).toBe(180);
    });

    it('should snap angles within threshold of 270°', () => {
      expect(microSnapToCardinal(270 - MICRO_SNAP_THRESHOLD)).toBe(270);
      expect(microSnapToCardinal(270 - MICRO_SNAP_THRESHOLD + 1)).toBe(270);
      expect(microSnapToCardinal(270)).toBe(270);
      expect(microSnapToCardinal(270 + MICRO_SNAP_THRESHOLD - 1)).toBe(270);
      expect(microSnapToCardinal(270 + MICRO_SNAP_THRESHOLD)).toBe(270);
    });
  });

  describe('wraparound behavior for 0°/360°', () => {
    it('should snap angles close to 360° to 0°', () => {
      expect(microSnapToCardinal(360 - MICRO_SNAP_THRESHOLD)).toBe(0);
      expect(microSnapToCardinal(360 - MICRO_SNAP_THRESHOLD + 1)).toBe(0);
      expect(microSnapToCardinal(360)).toBe(0);
    });

    it('should handle angles greater than 360°', () => {
      expect(microSnapToCardinal(360 + MICRO_SNAP_THRESHOLD - 1)).toBe(0);
      expect(microSnapToCardinal(360 + MICRO_SNAP_THRESHOLD)).toBe(0);
      expect(microSnapToCardinal(360 + MICRO_SNAP_THRESHOLD + 1)).toBe(MICRO_SNAP_THRESHOLD + 1);
    });

    it('should handle negative angles', () => {
      expect(microSnapToCardinal(-1)).toBe(0);
      expect(microSnapToCardinal(-MICRO_SNAP_THRESHOLD)).toBe(0);
      expect(microSnapToCardinal(-MICRO_SNAP_THRESHOLD - 1)).toBe(360 - MICRO_SNAP_THRESHOLD - 1);
    });
  });

  describe('threshold boundaries', () => {
    it('should snap at exactly threshold', () => {
      expect(microSnapToCardinal(MICRO_SNAP_THRESHOLD)).toBe(0);
      expect(microSnapToCardinal(90 + MICRO_SNAP_THRESHOLD)).toBe(90);
      expect(microSnapToCardinal(180 + MICRO_SNAP_THRESHOLD)).toBe(180);
      expect(microSnapToCardinal(270 + MICRO_SNAP_THRESHOLD)).toBe(270);
    });

    it('should not snap beyond threshold', () => {
      expect(microSnapToCardinal(MICRO_SNAP_THRESHOLD + 1)).toBe(MICRO_SNAP_THRESHOLD + 1);
      expect(microSnapToCardinal(90 + MICRO_SNAP_THRESHOLD + 1)).toBe(90 + MICRO_SNAP_THRESHOLD + 1);
      expect(microSnapToCardinal(180 + MICRO_SNAP_THRESHOLD + 1)).toBe(180 + MICRO_SNAP_THRESHOLD + 1);
      expect(microSnapToCardinal(270 + MICRO_SNAP_THRESHOLD + 1)).toBe(270 + MICRO_SNAP_THRESHOLD + 1);
    });

    it('should handle angles just beyond threshold from below', () => {
      expect(microSnapToCardinal(90 - MICRO_SNAP_THRESHOLD - 1)).toBe(90 - MICRO_SNAP_THRESHOLD - 1);
      expect(microSnapToCardinal(180 - MICRO_SNAP_THRESHOLD - 1)).toBe(180 - MICRO_SNAP_THRESHOLD - 1);
      expect(microSnapToCardinal(270 - MICRO_SNAP_THRESHOLD - 1)).toBe(270 - MICRO_SNAP_THRESHOLD - 1);
      expect(microSnapToCardinal(360 - MICRO_SNAP_THRESHOLD - 1)).toBe(360 - MICRO_SNAP_THRESHOLD - 1);
    });
  });

  describe('no snapping at non-cardinal angles', () => {
    it('should not snap angles at midpoints between cardinals', () => {
      expect(microSnapToCardinal(45)).toBe(45);
      expect(microSnapToCardinal(135)).toBe(135);
      expect(microSnapToCardinal(225)).toBe(225);
      expect(microSnapToCardinal(315)).toBe(315);
    });

    it('should not snap arbitrary angles', () => {
      expect(microSnapToCardinal(30)).toBe(30);
      expect(microSnapToCardinal(60)).toBe(60);
      expect(microSnapToCardinal(120)).toBe(120);
      expect(microSnapToCardinal(150)).toBe(150);
      expect(microSnapToCardinal(200)).toBe(200);
      expect(microSnapToCardinal(300)).toBe(300);
    });
  });

  describe('floating point angles', () => {
    it('should handle floating point angles within threshold', () => {
      expect(microSnapToCardinal(0.5)).toBe(0);
      expect(microSnapToCardinal(1.5)).toBe(0);
      expect(microSnapToCardinal(90.5)).toBe(90);
      expect(microSnapToCardinal(180 - 0.5)).toBe(180);
    });

    it('should handle floating point angles beyond threshold', () => {
      expect(microSnapToCardinal(MICRO_SNAP_THRESHOLD + 0.5)).toBe(MICRO_SNAP_THRESHOLD + 0.5);
      expect(microSnapToCardinal(90 + MICRO_SNAP_THRESHOLD + 0.5)).toBe(90 + MICRO_SNAP_THRESHOLD + 0.5);
      expect(microSnapToCardinal(180 + MICRO_SNAP_THRESHOLD + 0.5)).toBe(180 + MICRO_SNAP_THRESHOLD + 0.5);
    });
  });

  describe('angle normalization', () => {
    it('should normalize large positive angles before snapping', () => {
      expect(microSnapToCardinal(720)).toBe(0);
      expect(microSnapToCardinal(720 + MICRO_SNAP_THRESHOLD)).toBe(0);
      expect(microSnapToCardinal(720 + MICRO_SNAP_THRESHOLD + 1)).toBe(MICRO_SNAP_THRESHOLD + 1);
    });

    it('should normalize large negative angles before snapping', () => {
      expect(microSnapToCardinal(-360)).toBe(0);
      expect(microSnapToCardinal(-360 + MICRO_SNAP_THRESHOLD)).toBe(0);
      expect(microSnapToCardinal(-360 + MICRO_SNAP_THRESHOLD + 1)).toBe(MICRO_SNAP_THRESHOLD + 1);
    });

    it('should handle very large angles', () => {
      expect(microSnapToCardinal(1080)).toBe(0);
      expect(microSnapToCardinal(1080 + MICRO_SNAP_THRESHOLD)).toBe(0);
    });
  });
});
