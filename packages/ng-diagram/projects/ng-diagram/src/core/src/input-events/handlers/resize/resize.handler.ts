import { Point, Size } from '../../..';
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
          this.flow.actionStateManager.resize = {
            startX: x,
            startY: y,
            startWidth: node.size.width,
            startHeight: node.size.height,
            startNodePositionX: node.position.x,
            startNodePositionY: node.position.y,
            draggingNode: node,
          };
        }

        break;
      }

      case 'continue': {
        const resizeState = this.flow.actionStateManager.resize;
        if (!resizeState) {
          break;
        }

        const { startHeight, startNodePositionX, startNodePositionY, startWidth, startX, startY } = resizeState;
        const deltaX = Math.round(x - startX);
        const deltaY = Math.round(y - startY);
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startNodePositionX;
        let newY = startNodePositionY;

        switch (event.direction) {
          case 'top-left': {
            newWidth = startWidth - deltaX;
            newX = startNodePositionX + (startWidth - newWidth);
            newHeight = startHeight - deltaY;
            newY = startNodePositionY + (startHeight - newHeight);
            break;
          }
          case 'top': {
            newHeight = startHeight - deltaY;
            newY = startNodePositionY + (startHeight - newHeight);
            break;
          }
          case 'top-right': {
            newWidth = startWidth + deltaX;
            newHeight = startHeight - deltaY;
            newY = startNodePositionY + (startHeight - newHeight);
            break;
          }
          case 'right': {
            newWidth = startWidth + deltaX;
            break;
          }
          case 'bottom-right': {
            newWidth = startWidth + deltaX;
            newHeight = startHeight + deltaY;
            break;
          }
          case 'bottom': {
            newHeight = startHeight + deltaY;
            break;
          }
          case 'bottom-left': {
            newWidth = startWidth - deltaX;
            newX = startNodePositionX + (startWidth - newWidth);
            newHeight = startHeight + deltaY;
            break;
          }
          case 'left': {
            newWidth = startWidth - deltaX;
            newX = startNodePositionX + (startWidth - newWidth);
            break;
          }
        }

        const resizeCommand: {
          id: string;
          disableAutoSize: boolean;
          size: Size;
          position?: Point;
        } = {
          id: event.target.id,
          disableAutoSize: true,
          size: { width: Math.round(newWidth), height: Math.round(newHeight) },
        };

        if (newX !== startNodePositionX || newY !== startNodePositionY) {
          resizeCommand.position = { x: Math.round(newX), y: Math.round(newY) };
        }

        this.flow.commandHandler.emit('resizeNode', resizeCommand);
        break;
      }
      case 'end': {
        this.flow.actionStateManager.clearResize();
        break;
      }
    }
  }
}
