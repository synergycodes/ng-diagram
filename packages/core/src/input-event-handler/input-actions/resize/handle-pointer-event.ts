import { FlowCore } from '../../../flow-core';
import { isResizeHandleTarget, Node, PointerEvent, ResizeHandlePosition } from '../../../types';

const MIN_NODE_SIZE = 50;

interface ResizeState {
  isResizing: boolean;
  handlePosition: ResizeHandlePosition;
  nodeId: Node['id'];
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startNodePositionX: number;
  startNodePositionY: number;
  draggingNode: Node | null;
}

const resizeState: ResizeState = {
  isResizing: false,
  handlePosition: 'top-left',
  nodeId: '',
  startX: 0,
  startY: 0,
  startWidth: 0,
  startHeight: 0,
  startNodePositionX: 0,
  startNodePositionY: 0,
  draggingNode: null,
};

export function handlePointerEvent(flowCore: FlowCore, event: PointerEvent) {
  const { x, y } = flowCore.clientToFlowPosition(event);
  switch (event.type) {
    case 'pointerdown':
      if (isResizeHandleTarget(event.target)) {
        resizeState.isResizing = true;
        resizeState.handlePosition = event.target.position;
        resizeState.nodeId = event.target.element.id;
        resizeState.startX = x;
        resizeState.startY = y;
        resizeState.startWidth = event.target.element.size!.width;
        resizeState.startHeight = event.target.element.size!.height;
        resizeState.startNodePositionX = event.target.element.position.x;
        resizeState.startNodePositionY = event.target.element.position.y;
        resizeState.draggingNode = flowCore.getNodeById(event.target.element.id);
      }
      break;
    case 'pointermove':
      if (resizeState.isResizing && resizeState.draggingNode) {
        const deltaX = x - resizeState.startX;
        const deltaY = y - resizeState.startY;
        let newWidth = resizeState.startWidth;
        let newHeight = resizeState.startHeight;
        let newX = resizeState.startNodePositionX;
        let newY = resizeState.startNodePositionY;

        switch (resizeState.handlePosition) {
          case 'top-left':
            newWidth = Math.max(resizeState.startWidth - deltaX, MIN_NODE_SIZE);
            newX = resizeState.startNodePositionX + (resizeState.startWidth - newWidth);
            newHeight = Math.max(resizeState.startHeight - deltaY, MIN_NODE_SIZE);
            newY = resizeState.startNodePositionY + (resizeState.startHeight - newHeight);
            break;
          case 'top':
            newHeight = Math.max(resizeState.startHeight - deltaY, MIN_NODE_SIZE);
            newY = resizeState.startNodePositionY + (resizeState.startHeight - newHeight);
            break;
          case 'top-right':
            newWidth = Math.max(resizeState.startWidth + deltaX, MIN_NODE_SIZE);
            newHeight = Math.max(resizeState.startHeight - deltaY, MIN_NODE_SIZE);
            newY = resizeState.startNodePositionY + (resizeState.startHeight - newHeight);
            break;
          case 'right':
            newWidth = Math.max(resizeState.startWidth + deltaX, MIN_NODE_SIZE);
            break;
          case 'bottom-right':
            newWidth = Math.max(resizeState.startWidth + deltaX, MIN_NODE_SIZE);
            newHeight = Math.max(resizeState.startHeight + deltaY, MIN_NODE_SIZE);
            break;
          case 'bottom':
            newHeight = Math.max(resizeState.startHeight + deltaY, MIN_NODE_SIZE);
            break;
          case 'bottom-left':
            newWidth = Math.max(resizeState.startWidth - deltaX, MIN_NODE_SIZE);
            newX = resizeState.startNodePositionX + (resizeState.startWidth - newWidth);
            newHeight = Math.max(resizeState.startHeight + deltaY, MIN_NODE_SIZE);
            break;
          case 'left':
            newWidth = Math.max(resizeState.startWidth - deltaX, MIN_NODE_SIZE);
            newX = resizeState.startNodePositionX + (resizeState.startWidth - newWidth);
            break;
        }

        const portsToUpdate = resizeState.draggingNode.ports?.map((port) => {
          if (!port.position || !port.size) {
            // TODO: think if we should throw an error for this case
            return { portId: port.id, portChanges: {} };
          }
          const startPortPosition = port.position;
          const startPortSize = port.size;

          const positionFactor = {
            x: startPortPosition.x / resizeState.startWidth,
            y: startPortPosition.y / resizeState.startHeight,
          };
          const sizeFactor = {
            width: startPortSize.width / resizeState.startWidth,
            height: startPortSize.height / resizeState.startHeight,
          };

          const newPortPos = {
            x: Math.round(positionFactor.x * newWidth),
            y: Math.round(positionFactor.y * newHeight),
          };
          const newPortSize = {
            width: Math.round(sizeFactor.width * newWidth),
            height: Math.round(sizeFactor.height * newHeight),
          };

          return {
            portId: port.id,
            portChanges: {
              position: newPortPos,
              size: newPortSize,
            },
          };
        });

        flowCore.commandHandler.emit('resizeNode', {
          id: resizeState.nodeId,
          disableAutoSize: true,
          position: { x: Math.round(newX), y: Math.round(newY) },
          size: { width: Math.round(newWidth), height: Math.round(newHeight) },
          ...(portsToUpdate ? { ports: portsToUpdate } : {}),
        });
      }
      break;
    case 'pointerup':
      resizeState.isResizing = false;
      resizeState.draggingNode = null;
      break;
  }
}
