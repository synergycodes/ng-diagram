import { NgDiagramMath } from '../../../math';
import type { RotationActionState } from '../../../types/action-state.interface';
import { EventHandler } from '../event-handler';
import { RotateInputEvent } from './rotate.event';

const MIN_DISTANCE_TO_CENTER = 30;

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
  /** The rotation state whose end or cancel is currently in flight. */
  private finishingState: RotationActionState | null = null;

  async handle(event: RotateInputEvent): Promise<void> {
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

        const pointerToCenterDistance = NgDiagramMath.distanceBetweenPoints(pointer, center);

        /*
          Someone has a mouse near the center,
          and a movement of a few pixels causes a huge jump in rotation.
          We just ignore that space and do not react.
        */
        if (pointerToCenterDistance < MIN_DISTANCE_TO_CENTER) {
          return;
        }

        // Calculate current angle from center to pointer
        const currentAngle = NgDiagramMath.angleBetweenPoints(center, pointer);
        const angleDelta = currentAngle - rotationState.startAngle;

        this.flow.commandHandler.emit('rotateNodeTo', {
          nodeId,
          angle: rotationState.initialNodeAngle + angleDelta,
        });
        break;
      }

      case 'end': {
        const rotationState = this.flow.actionStateManager.rotation;
        // Marks this state as being finished — cancel() must not roll back a
        // rotation whose normal end is already in flight.
        this.finishingState = rotationState ?? null;
        try {
          await this.flow.commandHandler.emit('rotateNodeStop', { nodeId: rotationState?.nodeId });
        } finally {
          // Cleanup must run even when the emit rejects, but a fast re-grab that
          // started a new rotation while the emit was suspended must not have its
          // fresh state cleared.
          if (this.flow.actionStateManager.rotation === rotationState) {
            this.flow.actionStateManager.clearRotation();
          }
          if (this.finishingState === rotationState) {
            this.finishingState = null;
          }
        }
        break;
      }
    }
  }

  override async cancel(): Promise<boolean> {
    const rotation = this.flow.actionStateManager.rotation;
    // No rotation, or its normal end (or another cancel) already owns the teardown.
    if (!rotation || rotation === this.finishingState) {
      return false;
    }
    this.finishingState = rotation;

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
    if (this.finishingState === rotation) {
      this.finishingState = null;
    }
    return true;
  }
}
