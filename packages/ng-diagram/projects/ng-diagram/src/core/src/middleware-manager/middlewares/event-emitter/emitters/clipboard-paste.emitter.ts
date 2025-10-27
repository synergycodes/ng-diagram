import type { EventManager } from '../../../../event-manager/event-manager';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class ClipboardPastedEmitter implements EventEmitter {
  name = 'ClipboardPastedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'paste') {
      return;
    }

    if (!context.actionStateManager.getState().copyPaste) {
      return;
    }

    const { initialNodesMap, initialEdgesMap, nodesMap, edgesMap } = context;

    const pastedNodes: Node[] = [];
    for (const [id, node] of nodesMap) {
      if (!initialNodesMap.has(id)) {
        pastedNodes.push(node);
      }
    }

    const pastedEdges: Edge[] = [];
    for (const [id, edge] of edgesMap) {
      if (!initialEdgesMap.has(id)) {
        pastedEdges.push(edge);
      }
    }

    if (pastedNodes.length > 0 || pastedEdges.length > 0) {
      eventManager.deferredEmit('clipboardPasted', {
        nodes: pastedNodes,
        edges: pastedEdges,
      });
    }
  }
}
