import { FlowCore } from '../../../flow-core';
import { PointerEvent } from '../../../types';
import { SCALE } from './zooming.config';

const eventCache: PointerEvent[] = [];
let start = { x: 0, y: 0, distance: 0 };

function computeDistance(): number {
  return Math.hypot(eventCache[0].x - eventCache[1].x, eventCache[0].y - eventCache[1].y);
}

function removeEvent(event: PointerEvent) {
  const index = eventCache.findIndex((cachedEvent) => cachedEvent.pointerId === event.pointerId);
  eventCache.splice(index, 1);
}

function updateCache(event: PointerEvent) {
  const index = eventCache.findIndex((cachedEvent) => cachedEvent.pointerId === event.pointerId);
  eventCache[index] = event;
}

export function handlePointerEvent(event: PointerEvent, flowCore: FlowCore) {
  switch (event.type) {
    case 'pointerdown':
      eventCache.push(event);
      if (eventCache.length === 2) {
        const { x, y, scale } = flowCore.getState().metadata.viewport;
        start.x = ((eventCache[0].x + eventCache[1].x) / 2 - x) / scale;
        start.y = ((eventCache[0].y + eventCache[1].y) / 2 - y) / scale;
        start.distance = computeDistance();
      }
      break;
    case 'pointermove':
      updateCache(event);

      if (eventCache.length === 2) {
        let { x, y, scale } = flowCore.getState().metadata.viewport;

        start.x = (eventCache[0].x + eventCache[1].x) / 2;
        start.y = (eventCache[0].y + eventCache[1].y) / 2;

        const beforeZoomX = (start.x - x) / scale;
        const beforeZoomY = (start.y - y) / scale;
        const deltaDistance = computeDistance() / start.distance;
        const zoomFactor = Math.min(Math.max(1 - SCALE.STEP, deltaDistance), 1 + SCALE.STEP);

        scale *= zoomFactor;
        scale = Math.min(Math.max(SCALE.MIN, scale), SCALE.MAX);

        const afterZoomX = (start.x - x) / scale;
        const afterZoomY = (start.y - y) / scale;

        x += (afterZoomX - beforeZoomX) * scale;
        y += (afterZoomY - beforeZoomY) * scale;

        flowCore.commandHandler.emit('zoom', { x, y, scale });
      }
      break;
    case 'pointerup':
      removeEvent(event);
      if (eventCache.length < 2) {
        start = { x: 0, y: 0, distance: 0 };
      }
      break;
  }
}
