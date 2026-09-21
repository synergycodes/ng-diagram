import type { EventManager } from '../../../../event-manager/event-manager';
import type { EdgeRelinkEndedEvent, EdgeRelinkStartedEvent } from '../../../../event-manager/event-types';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class EdgeRelinkStartedEmitter implements EventEmitter {
  name = 'EdgeRelinkStartedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('startRelinking')) {
      return;
    }

    const relink = context.actionStateManager.linking?.relink;
    if (!relink) {
      return;
    }

    const event: EdgeRelinkStartedEvent = {
      edge: relink.originalEdge,
      end: relink.end,
    };
    eventManager.deferredEmit('edgeRelinkStarted', event);
  }
}

export class EdgeRelinkEndedEmitter implements EventEmitter {
  name = 'EdgeRelinkEndedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('finishRelinking')) {
      return;
    }

    const linking = context.actionStateManager.linking;
    const relink = linking?.relink;
    if (!linking || !relink) {
      return;
    }

    const { originalEdge, end } = relink;
    const success = !linking.relinkCancelReason;
    const currentEdge = context.edgesMap.get(relink.edgeId);
    const edge = success ? (currentEdge ?? originalEdge) : originalEdge;

    const previousNodeId = end === 'source' ? originalEdge.source : originalEdge.target;
    const previousPort = end === 'source' ? originalEdge.sourcePort : originalEdge.targetPort;
    const previousPosition = end === 'source' ? originalEdge.sourcePosition : originalEdge.targetPosition;

    const newNodeId = success ? (end === 'source' ? edge.source : edge.target) : '';

    const event: EdgeRelinkEndedEvent = {
      edge,
      end,
      previousNode: previousNodeId ? context.nodesMap.get(previousNodeId) : undefined,
      previousPort: previousPort || undefined,
      // The previous position only matters when the endpoint was dangling.
      previousPosition: previousNodeId ? undefined : previousPosition,
      dropPosition: linking.dropPosition ?? { x: 0, y: 0 },
      success,
      target: newNodeId ? context.nodesMap.get(newNodeId) : undefined,
      targetPort: success ? (end === 'source' ? edge.sourcePort : edge.targetPort) || undefined : undefined,
      reason: linking.relinkCancelReason,
    };
    eventManager.deferredEmit('edgeRelinkEnded', event);
  }
}
