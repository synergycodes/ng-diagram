import { NgDiagramMath } from '../../../math';
import { EventHandler } from '../event-handler';
import { ZoomingEvent } from './zooming.event';

export class ZoomingEventHandler extends EventHandler<ZoomingEvent> {
  handle(event: ZoomingEvent): void {
    const {
      centerPoint: { x: centerX, y: centerY },
      zoomFactor,
    } = event;

    let { x, y, scale } = this.flow.getState().metadata.viewport;
    const { x: offsetX, y: offsetY } = this.flow.getFlowOffset();

    // Apply zoom with center point preservation
    const beforeZoomX = (centerX - x - offsetX) / scale;
    const beforeZoomY = (centerY - y - offsetY) / scale;

    scale *= zoomFactor;
    scale = NgDiagramMath.clamp({
      min: this.flow.config.zoom.min,
      value: scale,
      max: this.flow.config.zoom.max,
    });

    const afterZoomX = (centerX - x - offsetX) / scale;
    const afterZoomY = (centerY - y - offsetY) / scale;

    x += (afterZoomX - beforeZoomX) * scale;
    y += (afterZoomY - beforeZoomY) * scale;

    this.flow.commandHandler.emit('zoom', { x, y, scale: scale });
  }
}
