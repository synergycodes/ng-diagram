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

    // Apply zoom with center point preservation
    const beforeZoomX = (centerX - x - this.flow.getFlowOffset().x) / scale;
    const beforeZoomY = (centerY - y - this.flow.getFlowOffset().y) / scale;

    scale *= zoomFactor;
    scale = NgDiagramMath.clamp({
      min: this.flow.config.zoom.min,
      value: scale,
      max: this.flow.config.zoom.max,
    });

    const afterZoomX = (centerX - x - this.flow.getFlowOffset().x) / scale;
    const afterZoomY = (centerY - y - this.flow.getFlowOffset().y) / scale;

    x += (afterZoomX - beforeZoomX) * scale;
    y += (afterZoomY - beforeZoomY) * scale;

    this.flow.commandHandler.emit('zoom', { x, y, scale: scale });
  }
}
