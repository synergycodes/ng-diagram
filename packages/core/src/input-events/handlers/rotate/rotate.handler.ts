import { NgDiagramMath } from '../../../math';
import { EventHandler } from '../event-hander';
import { RotateInputEvent } from './rotate.event';

const MIN_DISTANCE_TO_CENTER = 30;

export class RotateEventHandler extends EventHandler<RotateInputEvent> {
  handle(event: RotateInputEvent): void {
    const { center, lastInputPoint, target, phase } = event;
    if (!target) {
      throw new Error('Rotate event must have a target Node');
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
        this.flow.actionStateManager.clearRotation();
        break;
      }
    }
  }
}
