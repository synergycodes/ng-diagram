import { FlowCore } from '../../../flow-core';
import { WheelEvent } from '../../../types';
import { SCALE } from './zooming.config';

export function handleWheelEvent(event: WheelEvent, flowCore: FlowCore) {
  let { x, y, scale } = flowCore.getState().metadata.viewport;
  const beforeZoomX = (event.x - x) / scale;
  const beforeZoomY = (event.y - y) / scale;
  const zoomFactor = event.deltaY > 0 ? 1 - SCALE.STEP : 1 + SCALE.STEP;

  scale *= zoomFactor;
  scale = Math.min(Math.max(SCALE.MIN, scale), SCALE.MAX);

  const afterZoomX = (event.x - x) / scale;
  const afterZoomY = (event.y - y) / scale;

  x += (afterZoomX - beforeZoomX) * scale;
  y += (afterZoomY - beforeZoomY) * scale;

  flowCore.commandHandler.emit('zoom', { x, y, scale });
}
