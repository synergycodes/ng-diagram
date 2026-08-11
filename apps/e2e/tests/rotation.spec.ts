import { expect, test } from './fixtures/diagram';
import { spin } from './fixtures/models';

/**
 * Pointer-driven rotation through the rotate handle. The fast-release run
 * releases the pointer in the same frame as the last move (the trailing
 * coalesced pointermove is lost), so it must end at the same angle as the
 * settled run — the end phase recovers the release point.
 */

test.describe('rotation gestures', () => {
  test('a fast release ends at the same angle as a settled release', async ({ diagram }) => {
    await diagram.load({ model: spin });

    const rotateOnce = async (settleFrame: boolean): Promise<number> => {
      await diagram.model.updateNode('spin', { angle: 30 });
      await expect.poll(async () => (await diagram.model.getNodeById('spin'))?.angle).toBe(30);
      await diagram.nextFrame();
      await diagram.node('spin').click();

      await diagram.dragRotateHandle('spin', { x: 120, y: 120 }, { settleFrame });

      await expect.poll(async () => (await diagram.model.getNodeById('spin'))?.angle).not.toBe(30);
      await diagram.nextFrame();
      await diagram.nextFrame();
      return (await diagram.model.getNodeById('spin'))!.angle!;
    };

    const settled = await rotateOnce(true);
    const fast = await rotateOnce(false);

    expect(fast).toBe(settled);
  });
});
