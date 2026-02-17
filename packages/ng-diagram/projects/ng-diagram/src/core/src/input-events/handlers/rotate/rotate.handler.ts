import { NgDiagramMath } from '../../../math';
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

        this.flow.commandHandler.emit('rotateNodeStart');
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
        await this.flow.commandHandler.emit('rotateNodeStop');
        this.flow.actionStateManager.clearRotation();
        break;
      }
    }
  }
}
