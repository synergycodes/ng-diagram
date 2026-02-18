import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

function resolveNodes(nodeIds: string[], nodesMap: Map<string, Node>): Node[] {
  const nodes: Node[] = [];
  for (const id of nodeIds) {
    const node = nodesMap.get(id);
    if (node) {
      nodes.push(node);
    }
  }
  return nodes;
}

export class NodeDragStartedEmitter implements EventEmitter {
  name = 'NodeDragStartedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('moveNodesStart')) {
      return;
    }

    const nodeIds = context.actionStateManager.dragging?.nodeIds;
    if (!nodeIds || nodeIds.length === 0) {
      return;
    }

    const nodes = resolveNodes(nodeIds, context.nodesMap);
    if (nodes.length === 0) {
      return;
    }

    eventManager.deferredEmit('nodeDragStarted', { nodes });
  }
}

export class NodeDragEndedEmitter implements EventEmitter {
  name = 'NodeDragEndedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('moveNodesStop')) {
      return;
    }

    const nodeIds = context.actionStateManager.dragging?.nodeIds;
    if (!nodeIds || nodeIds.length === 0) {
      return;
    }

    const nodes = resolveNodes(nodeIds, context.nodesMap);
    if (nodes.length === 0) {
      return;
    }

    eventManager.deferredEmit('nodeDragEnded', { nodes });
  }
}
