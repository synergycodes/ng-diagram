import type { EventManager } from '../../../../event-manager/event-manager';
import type { SelectionRotatedEvent } from '../../../../event-manager/event-types';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionRotatedEmitter implements EventEmitter {
  name = 'SelectionRotatedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('rotateNodeTo')) {
      return;
    }

    const { initialNodesMap, nodesMap } = context;
    const rotatedNodeUpdate = context.initialUpdate.nodesToUpdate?.[0];

    if (!rotatedNodeUpdate) {
      return;
    }

    const nodeId = rotatedNodeUpdate.id;
    const initialNode = initialNodesMap.get(nodeId);
    const currentNode = nodesMap.get(nodeId);

    if (!initialNode || !currentNode) {
      return;
    }

    const previousAngle = initialNode.angle ?? 0;
    const newAngle = currentNode.angle ?? 0;

    if (previousAngle !== newAngle) {
      const event: SelectionRotatedEvent = {
        node: currentNode,
        angle: newAngle,
        previousAngle,
      };
      eventManager.deferredEmit('selectionRotated', event);
    }
  }
}
