import { getNodesInRect } from '../../../spatial-hash/utils';
import { Point } from '../../../types';
import { EventHandler } from '../event-handler';
import { BoxSelectionEvent } from './box-selection.event';

export class BoxSelectionEventHandler extends EventHandler<BoxSelectionEvent> {
  private startPoint: Point | undefined;
  private isBoxSelecting = false;

  handle(event: BoxSelectionEvent): void {
    switch (event.phase) {
      case 'start': {
        this.startPoint = event.lastInputPoint;
        this.isBoxSelecting = true;
        break;
      }
      case 'continue': {
        if (!this.isBoxSelecting || !this.flow.config.boxSelection.realtime) {
          break;
        }

        this.boxSelect(event);
        break;
      }
      case 'end': {
        if (!this.isBoxSelecting) {
          break;
        }

        this.boxSelect(event);
        this.flow.commandHandler.emit('selectEnd');
        this.startPoint = undefined;
        this.isBoxSelecting = false;
        break;
      }
    }
  }

  private boxSelect(event: BoxSelectionEvent): void {
    if (!this.startPoint) {
      return;
    }

    const lastPoint = event.lastInputPoint;

    const { x: startX, y: startY } = this.flow.clientToFlowPosition(this.startPoint);
    const { x: lastX, y: lastY } = this.flow.clientToFlowPosition(lastPoint);

    const x = Math.min(startX, lastX);
    const y = Math.min(startY, lastY);
    const width = Math.abs(lastX - startX);
    const height = Math.abs(lastY - startY);

    const rect = {
      x,
      y,
      width,
      height,
    };

    const edges = this.flow.model.getEdges();

    const nodeIds = new Set(
      getNodesInRect(this.flow, rect, this.flow.config.boxSelection.partialInclusion).map((node) => node.id)
    );

    // An edge is inside the box when each endpoint is: a node inside the box,
    // or a free (dangling) endpoint whose anchor position lies inside the box.
    const isPointInRect = (point: Point | undefined): boolean =>
      !!point &&
      point.x >= rect.x &&
      point.x <= rect.x + rect.width &&
      point.y >= rect.y &&
      point.y <= rect.y + rect.height;
    const isEndpointInBox = (nodeId: string, position: Point | undefined): boolean =>
      nodeId ? nodeIds.has(nodeId) : isPointInRect(position);

    // Endpoint containment comes from the spatial hash (hidden nodes already
    // excluded), but an edge can be hidden on its own — filter it here.
    const edgesBetweenIds = edges
      .filter(
        (edge) =>
          !edge.computedHidden &&
          isEndpointInBox(edge.source, edge.sourcePosition) &&
          isEndpointInBox(edge.target, edge.targetPosition)
      )
      .map((edge) => edge.id);

    this.flow.commandHandler.emit('select', {
      nodeIds: [...nodeIds],
      edgeIds: edgesBetweenIds,
      multiSelection: false,
    });
  }
}
