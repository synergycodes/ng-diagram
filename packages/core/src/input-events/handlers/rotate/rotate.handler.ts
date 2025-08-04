import { NgDiagramMath } from '../../../math';
import { EventHandler } from '../event-hander';
import { RotateInputEvent } from './rotate.event';

const MIN_DISTANCE_TO_CENTER = 30;

export class RotateEventHandler extends EventHandler<RotateInputEvent> {
  handle(event: RotateInputEvent): void {
    const { center, handle, lastInputPoint, target } = event;
    if (!target) {
      throw new Error('Rotate event must have a target Node');
    }

    const nodeId = target?.id;
    const pointer = this.flow.clientToFlowPosition(lastInputPoint);
    const pointerToCenterDistance = NgDiagramMath.distanceBetweenPoints(pointer, center);

    /*
      Someone has a mouse near the center,
      and a movement of a few pixels causes a huge jump in rotation.

      We just ignore that space and do not react.
    */
    if (pointerToCenterDistance < MIN_DISTANCE_TO_CENTER) return;

    const angle = NgDiagramMath.angleBetweenPoints(handle, center, pointer);
    console.log('Rotate angle:', angle, 'degrees');

    this.flow.commandHandler.emit('rotateNodeBy', {
      nodeId,
      angle,
    });
  }
}
