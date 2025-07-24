import { Node } from '../../../types/node.interface';
import { EventHandler } from '../event-hander';
import { ResizeEvent } from './resize.event';

export class ResizeEventHandler extends EventHandler<ResizeEvent> {
  isResizing = false;
  startWidth?: number;
  startHeight?: number;
  startX?: number;
  startY?: number;
  startNodePositionX?: number;
  startNodePositionY?: number;
  draggingNode?: Node;

  handle(event: ResizeEvent): void {
    if (!event.target) {
      throw new Error('Resize event must have a target Node');
    }

    const { x, y } = this.flow.clientToFlowPosition(event.lastInputPoint);
    switch (event.phase) {
      case 'start': {
        this.isResizing = true;

        this.startX = x;
        this.startY = y;

        const node = this.flow.getNodeById(event.target.id);
        if (node && node.size) {
          this.startWidth = node.size.width;
          this.startHeight = node.size.height;
          this.startNodePositionX = node.position.x;
          this.startNodePositionY = node.position.y;
          this.draggingNode = node;
        }

        break;
      }

      case 'continue': {
        if (
          !this.isResizing ||
          !this.draggingNode ||
          !this.startX ||
          !this.startY ||
          !this.startWidth ||
          !this.startHeight ||
          !this.startNodePositionX ||
          !this.startNodePositionY
        ) {
          break;
        }

        const deltaX = Math.round(x - this.startX);
        const deltaY = Math.round(y - this.startY);
        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        let newX = this.startNodePositionX;
        let newY = this.startNodePositionY;

        switch (event.direction) {
          case 'top-left': {
            newWidth = this.startWidth - deltaX;
            newX = this.startNodePositionX + (this.startWidth - newWidth);
            newHeight = this.startHeight - deltaY;
            newY = this.startNodePositionY + (this.startHeight - newHeight);
            break;
          }
          case 'top': {
            newHeight = this.startHeight - deltaY;
            newY = this.startNodePositionY + (this.startHeight - newHeight);
            break;
          }
          case 'top-right': {
            newWidth = this.startWidth + deltaX;
            newHeight = this.startHeight - deltaY;
            newY = this.startNodePositionY + (this.startHeight - newHeight);
            break;
          }
          case 'right': {
            newWidth = this.startWidth + deltaX;
            break;
          }
          case 'bottom-right': {
            newWidth = this.startWidth + deltaX;
            newHeight = this.startHeight + deltaY;
            break;
          }
          case 'bottom': {
            newHeight = this.startHeight + deltaY;
            break;
          }
          case 'bottom-left': {
            newWidth = this.startWidth - deltaX;
            newX = this.startNodePositionX + (this.startWidth - newWidth);
            newHeight = this.startHeight + deltaY;
            break;
          }
          case 'left': {
            newWidth = this.startWidth - deltaX;
            newX = this.startNodePositionX + (this.startWidth - newWidth);
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
        this.isResizing = false;
        this.draggingNode = undefined;
        break;
      }
    }
  }
}
