import { FlowCore } from '../../../flow-core';
import { WheelInputEvent } from '../../../types/__old__event/event.interface';
import { SCALE } from './zooming.config';

export function handleWheelEvent(event: WheelInputEvent, flowCore: FlowCore) {
  let { x, y, scale } = flowCore.getState().metadata.viewport;
  const beforeZoomX = (event.position.x - x) / scale;
  const beforeZoomY = (event.position.y - y) / scale;
  const zoomFactor = event.delta.y > 0 ? 1 - SCALE.STEP : 1 + SCALE.STEP;

  scale *= zoomFactor;
  scale = Math.min(Math.max(SCALE.MIN, scale), SCALE.MAX);

  const afterZoomX = (event.position.x - x) / scale;
  const afterZoomY = (event.position.y - y) / scale;

  x += (afterZoomX - beforeZoomX) * scale;
  y += (afterZoomY - beforeZoomY) * scale;

  flowCore.commandHandler.emit('zoom', { x, y, scale });
}
