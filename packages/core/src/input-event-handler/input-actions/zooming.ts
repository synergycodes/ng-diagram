import { isWheelEvent, type InputActionWithPredicate } from '../../types';

const SCALE = {
  MIN: 0.1,
  MAX: 10,
  STEP: 0.05,
} as const;

export const zoomingAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (!isWheelEvent(event)) {
      return;
    }

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
  },
  predicate: (event) => isWheelEvent(event),
};
