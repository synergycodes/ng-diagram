import { Node } from '../../../types/node.interface';
import { __NEW__EventHandler } from '../event-hander';
import { __NEW__ResizeEvent } from './resize.event';

const MIN_NODE_SIZE = 50;

export class __NEW__ResizeEventHandler extends __NEW__EventHandler<__NEW__ResizeEvent> {
  isResizing = false;
  startWidth?: number;
  startHeight?: number;
  startX?: number;
  startY?: number;
  startNodePositionX?: number;
  startNodePositionY?: number;
  draggingNode?: Node;

  handle(event: __NEW__ResizeEvent): void {
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

        const deltaX = x - this.startX;
        const deltaY = y - this.startY;
        let newWidth = this.startWidth;
        let newHeight = this.startHeight;
        let newX = this.startNodePositionX;
        let newY = this.startNodePositionY;

        switch (event.direction) {
          case 'top-left': {
            newWidth = Math.max(this.startWidth - deltaX, MIN_NODE_SIZE);
            newX = this.startNodePositionX + (this.startWidth - newWidth);
            newHeight = Math.max(this.startHeight - deltaY, MIN_NODE_SIZE);
            newY = this.startNodePositionY + (this.startHeight - newHeight);
            break;
          }
          case 'top': {
            newHeight = Math.max(this.startHeight - deltaY, MIN_NODE_SIZE);
            newY = this.startNodePositionY + (this.startHeight - newHeight);
            break;
          }
          case 'top-right': {
            newWidth = Math.max(this.startWidth + deltaX, MIN_NODE_SIZE);
            newHeight = Math.max(this.startHeight - deltaY, MIN_NODE_SIZE);
            newY = this.startNodePositionY + (this.startHeight - newHeight);
            break;
          }
          case 'right': {
            newWidth = Math.max(this.startWidth + deltaX, MIN_NODE_SIZE);
            break;
          }
          case 'bottom-right': {
            newWidth = Math.max(this.startWidth + deltaX, MIN_NODE_SIZE);
            newHeight = Math.max(this.startHeight + deltaY, MIN_NODE_SIZE);
            break;
          }
          case 'bottom': {
            newHeight = Math.max(this.startHeight + deltaY, MIN_NODE_SIZE);
            break;
          }
          case 'bottom-left': {
            newWidth = Math.max(this.startWidth - deltaX, MIN_NODE_SIZE);
            newX = this.startNodePositionX + (this.startWidth - newWidth);
            newHeight = Math.max(this.startHeight + deltaY, MIN_NODE_SIZE);
            break;
          }
          case 'left': {
            newWidth = Math.max(this.startWidth - deltaX, MIN_NODE_SIZE);
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
