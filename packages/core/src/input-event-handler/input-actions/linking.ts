import {
  isContinue,
  isEnd,
  isPointer,
  isStart,
  onPort,
  Port,
  PortTarget,
  withPrimaryButton,
  type InputActionWithPredicate,
} from '../../types';
import { and, or, targetIs } from './input-actions.helpers';

let isLinking = false;

const isProperTargetPort = (targetPort: Port, source?: string, sourcePortId?: string) => {
  if (targetPort.type === 'source') {
    return false;
  }
  if (source && targetPort.nodeId !== source) {
    return true;
  }
  if (sourcePortId && targetPort.id !== sourcePortId) {
    return true;
  }
  return false;
};

export const linkingAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (!isPointer(event)) return;

    switch (event.phase) {
      case 'start': {
        isLinking = true;
        const target = event.target as PortTarget;

        flowCore.commandHandler.emit('startLinking', {
          source: target.element.nodeId,
          sourcePort: target.element.id,
        });
        break;
      }
      case 'continue': {
        if (!isLinking) break;

        const flowPosition = flowCore.clientToFlowPosition(event.position);
        const nearestPort = flowCore.getNearestPortInRange(flowPosition, 10);

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

        break;
      }

      case 'end': {
        if (!isLinking) break;

        isLinking = false;
        const temporaryEdge = flowCore.getState().metadata.temporaryEdge;
        flowCore.commandHandler.emit('finishLinking', {
          target: temporaryEdge?.target,
          targetPort: temporaryEdge?.targetPort,
        });

        break;
      }
    }
  },
  predicate: and(
    isPointer,
    or(
      and(
        isStart,
        withPrimaryButton,
        targetIs(onPort),
        (event) => (event.target as PortTarget).element.type !== 'target'
      ),
      and(isContinue, () => isLinking),
      and(isEnd, withPrimaryButton)
    )
  ),
};
