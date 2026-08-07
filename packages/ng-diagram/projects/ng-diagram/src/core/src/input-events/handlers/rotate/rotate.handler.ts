import { NgDiagramMath } from '../../../math';
import type { Point, RotationActionState } from '../../../types';
import { EventHandler } from '../event-handler';
import { RotateInputEvent } from './rotate.event';

export const MIN_DISTANCE_TO_CENTER = 30;

const ROTATE_MISSING_TARGET_ERROR = (event: RotateInputEvent) =>
  `[ngDiagram] Rotate event missing target node.

Event details:
  • Phase: ${event.phase}
  • Target type: ${event.targetType}
  • Pointer position: (${event.lastInputPoint.x}, ${event.lastInputPoint.y})
  • Center: (${event.center.x}, ${event.center.y})

This indicates a programming error. Rotation events must have a target node.

Documentation: https://www.ngdiagram.dev/docs/guides/nodes/rotation/`;

export class RotateEventHandler extends EventHandler<RotateInputEvent> {
  async handle(event: RotateInputEvent): Promise<void> {
    if (this.flow.isCancellingInteraction()) {
      return;
    }
    const { center, lastInputPoint, target, phase } = event;
    if (!target) {
      throw new Error(ROTATE_MISSING_TARGET_ERROR(event));
    }

    const nodeId = target?.id;
    const pointer = this.flow.clientToFlowPosition(lastInputPoint);

    switch (phase) {
      case 'start': {
        const node = this.flow.getNodeById(nodeId);
        if (!node) {
          return;
        }

        // Calculate initial angle from center to pointer
        const initialAngle = NgDiagramMath.angleBetweenPoints(center, pointer);

        this.flow.actionStateManager.rotation = {
          startAngle: initialAngle,
          initialNodeAngle: node.angle ?? 0,
          nodeId,
        };

        await this.flow.commandHandler.emit('rotateNodeStart', { nodeId });
        break;
      }

      case 'continue': {
        const rotationState = this.flow.actionStateManager.rotation;
        if (!rotationState || rotationState.nodeId !== nodeId) {
          return;
        }

        const angle = this.computeTargetAngle(rotationState, pointer, center);
        if (angle === null) {
          return;
        }

        this.flow.commandHandler.emit('rotateNodeTo', { nodeId, angle });
        break;
      }

      case 'end': {
        const rotationState = this.flow.actionStateManager.rotation;
        this.claimTeardown(rotationState);
        try {
          // pointerup is not frame-aligned: the coalesced pointermove of the final
          // frame may never be delivered, so the release point itself is applied as
          // the last rotation. rotateNodeTo no-ops when the angle did not change.
          if (rotationState && rotationState.nodeId === nodeId) {
            const angle = this.computeTargetAngle(rotationState, pointer, center);
            if (angle !== null) {
              await this.flow.commandHandler.emit('rotateNodeTo', { nodeId, angle });
            }
          }
        } finally {
          try {
            await this.flow.commandHandler.emit('rotateNodeStop', { nodeId: rotationState?.nodeId });
          } finally {
            // Cleanup must run even when the emit rejects, but a fast re-grab that
            // started a new rotation while the emit was suspended must not have its
            // fresh state cleared.
            if (this.flow.actionStateManager.rotation === rotationState) {
              this.flow.actionStateManager.clearRotation();
            }
          }
        }
        break;
      }
    }
  }

  /** Angle math shared by continue and end; null inside the dead zone around the center. */
  private computeTargetAngle(rotationState: RotationActionState, pointer: Point, center: Point): number | null {
    /*
      Someone has a mouse near the center,
      and a movement of a few pixels causes a huge jump in rotation.
      We just ignore that space and do not react.
    */
    if (NgDiagramMath.distanceBetweenPoints(pointer, center) < MIN_DISTANCE_TO_CENTER) {
      return null;
    }

    const currentAngle = NgDiagramMath.angleBetweenPoints(center, pointer);
    const angleDelta = currentAngle - rotationState.startAngle;

    return rotationState.initialNodeAngle + angleDelta;
  }

  override async cancel(): Promise<boolean> {
    const rotation = this.flow.actionStateManager.rotation;
    if (!rotation || this.isTeardownClaimed(rotation)) {
      return false;
    }
    this.claimTeardown(rotation);

    rotation.cancelReason = 'cancelled';

    // Restore the exact pre-rotation angle (updateNode instead of rotateNodeTo
    // so angle snapping can't distort the original value).
    await this.flow.transaction('cancelRotate', async (tx) => {
      await tx.emit('updateNode', {
        id: rotation.nodeId,
        nodeChanges: { angle: rotation.initialNodeAngle },
      });
      await tx.emit('rotateNodeStop', { nodeId: rotation.nodeId });
    });

    // A new rotation may have started while the transaction above was suspended —
    // the identity guard keeps its fresh state intact.
    if (this.flow.actionStateManager.rotation === rotation) {
      this.flow.actionStateManager.clearRotation();
    }
    return true;
  }
}
