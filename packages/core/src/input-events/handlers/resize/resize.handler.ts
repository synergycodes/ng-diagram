import { EventHandler } from '../event-hander';
import { ResizeEvent } from './resize.event';

export class ResizeEventHandler extends EventHandler<ResizeEvent> {
  handle(event: ResizeEvent): void {
    if (!event.target) {
      throw new Error('Resize event must have a target Node');
    }

    const { x, y } = this.flow.clientToFlowPosition(event.lastInputPoint);
    switch (event.phase) {
      case 'start': {
        const node = this.flow.getNodeById(event.target.id);
        if (node && node.size) {
          this.flow.actionStateManager.setResizeState({
            startX: x,
            startY: y,
            startWidth: node.size.width,
            startHeight: node.size.height,
            startNodePositionX: node.position.x,
            startNodePositionY: node.position.y,
            draggingNode: node,
          });
        }

        break;
      }

      case 'continue': {
        const resizeState = this.flow.actionStateManager.getResizeState();
        if (!resizeState) {
          break;
        }

        const deltaX = Math.round(x - resizeState.startX);
        const deltaY = Math.round(y - resizeState.startY);
        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newX = resizeState.startNodePositionX;
        let newY = resizeState.startNodePositionY;

        switch (event.direction) {
          case 'top-left': {
            newWidth = resizeState.startWidth - deltaX;
            newX = resizeState.startNodePositionX + (resizeState.startWidth - newWidth);
            newHeight = resizeState.startHeight - deltaY;
            newY = resizeState.startNodePositionY + (resizeState.startHeight - newHeight);
            break;
          }
          case 'top': {
            newHeight = resizeState.startHeight - deltaY;
            newY = resizeState.startNodePositionY + (resizeState.startHeight - newHeight);
            break;
          }
          case 'top-right': {
            newWidth = resizeState.startWidth + deltaX;
            newHeight = resizeState.startHeight - deltaY;
            newY = resizeState.startNodePositionY + (resizeState.startHeight - newHeight);
            break;
          }
          case 'right': {
            newWidth = resizeState.startWidth + deltaX;
            break;
          }
          case 'bottom-right': {
            newWidth = resizeState.startWidth + deltaX;
            newHeight = resizeState.startHeight + deltaY;
            break;
          }
          case 'bottom': {
            newHeight = resizeState.startHeight + deltaY;
            break;
          }
          case 'bottom-left': {
            newWidth = resizeState.startWidth - deltaX;
            newX = resizeState.startNodePositionX + (resizeState.startWidth - newWidth);
            newHeight = resizeState.startHeight + deltaY;
            break;
          }
          case 'left': {
            newWidth = resizeState.startWidth - deltaX;
            newX = resizeState.startNodePositionX + (resizeState.startWidth - newWidth);
            break;
          }
        }

        this.flow.commandHandler.emit('resizeNode', {
          id: event.target.id,
          disableAutoSize: true,
          position: { x: Math.round(newX), y: Math.round(newY) },
          size: { width: Math.round(newWidth), height: Math.round(newHeight) },
        });
        break;
      }
      case 'end': {
        this.flow.actionStateManager.clearResizeState();
        break;
      }
    }
  }
}
