import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext, Node } from '../../../../types';
import { getNodesWithChildren } from '../../../utils/get-nodes-with-children';
import type { EventEmitter } from './event-emitter.interface';

const isDraggable = (node: Node) => node.draggable ?? true;

function getSelectedDraggableNodesWithChildren(nodesMap: Map<string, Node>): Node[] {
  const selectedNodeIds = [...nodesMap.values()].filter((n) => n.selected).map((n) => n.id);

  return getNodesWithChildren(selectedNodeIds, nodesMap).filter(isDraggable);
}

export class NodeDragStartedEmitter implements EventEmitter {
  name = 'NodeDragStartedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('moveNodesStart')) {
      return;
    }

    const nodes = getSelectedDraggableNodesWithChildren(context.nodesMap);

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

    const nodes = getSelectedDraggableNodesWithChildren(context.nodesMap);

    if (nodes.length === 0) {
      return;
    }

    eventManager.deferredEmit('nodeDragEnded', { nodes });
  }
}
