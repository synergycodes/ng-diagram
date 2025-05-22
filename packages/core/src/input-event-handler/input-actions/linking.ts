import {
  isPointerDownEvent,
  isPointerMoveEvent,
  isPointerUpEvent,
  isPortTarget,
  Port,
  type InputActionWithPredicate,
} from '../../types';

let isLinking = false;

const isProperTargetPort = (targetPort: Port, source?: string, sourcePortId?: string) => {
  if (!source || !sourcePortId) {
    return false;
  }
  if (targetPort.type === 'source') {
    return false;
  }
  if (targetPort.nodeId !== source) {
    return true;
  }
  if (targetPort.id !== sourcePortId) {
    return true;
  }
  return false;
};

export const linkingAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (isPointerDownEvent(event) && isPortTarget(event.target) && event.target.element.type !== 'target') {
      isLinking = true;
      flowCore.commandHandler.emit('startLinking', {
        source: event.target.element.nodeId,
        sourcePort: event.target.element.id,
      });
    }

    if (isPointerMoveEvent(event) && isLinking) {
      const flowPosition = flowCore.clientToFlowPosition({ x: event.x, y: event.y });
      const nearestPort = flowCore.getNearestPortInRange(flowPosition, 5);
      const { temporaryEdge } = flowCore.getState().metadata;
      if (nearestPort && isProperTargetPort(nearestPort, temporaryEdge?.source, temporaryEdge?.sourcePort)) {
        flowCore.commandHandler.emit('moveTemporaryEdge', {
          position: flowPosition,
          target: nearestPort.nodeId,
          targetPort: nearestPort.id,
        });
      } else {
        flowCore.commandHandler.emit('moveTemporaryEdge', {
          position: flowPosition,
          target: '',
          targetPort: '',
        });
      }
    }

    if (isPointerUpEvent(event) && isLinking) {
      isLinking = false;
      const temporaryEdge = flowCore.getState().metadata.temporaryEdge;
      flowCore.commandHandler.emit('finishLinking', {
        target: temporaryEdge?.target,
        targetPort: temporaryEdge?.targetPort,
      });
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) &&
      event.button === 0 &&
      isPortTarget(event.target) &&
      event.target.element.type !== 'target') ||
    (isPointerMoveEvent(event) && isLinking) ||
    (isPointerUpEvent(event) && event.button === 0),
};
