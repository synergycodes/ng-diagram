import type { EventManager } from '../../../../event-manager/event-manager';
import type { SelectionChangedEvent } from '../../../../event-manager/event-types';
import type { Edge, MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class SelectionChangedEmitter implements EventEmitter {
  name = 'SelectionChangedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'changeSelection') {
      return;
    }

    const { initialNodesMap, initialEdgesMap, nodesMap, edgesMap } = context;

    const prevSelectedNodes = this.collectSelectedNodes(initialNodesMap);
    const currSelectedNodes = this.collectSelectedNodes(nodesMap);

    const prevSelectedEdges = this.collectSelectedEdges(initialEdgesMap);
    const currSelectedEdges = this.collectSelectedEdges(edgesMap);

    const nodesChanged = !this.areSelectionsEqual(
      prevSelectedNodes.map((n) => n.id),
      currSelectedNodes.map((n) => n.id)
    );
    const edgesChanged = !this.areSelectionsEqual(
      prevSelectedEdges.map((e) => e.id),
      currSelectedEdges.map((e) => e.id)
    );

    if (nodesChanged || edgesChanged) {
      const event: SelectionChangedEvent = {
        selectedNodes: currSelectedNodes,
        selectedEdges: currSelectedEdges,
        previousNodes: prevSelectedNodes,
        previousEdges: prevSelectedEdges,
      };
      eventManager.emit('selectionChanged', event);
    }
  }

  private collectSelectedNodes(nodesMap: Map<string, Node>): Node[] {
    const selected: Node[] = [];
    for (const [, node] of nodesMap) {
      if (node.selected) {
        selected.push(node);
      }
    }
    return selected;
  }

  private collectSelectedEdges(edgesMap: Map<string, Edge>): Edge[] {
    const selected: Edge[] = [];
    for (const [, edge] of edgesMap) {
      if (edge.selected) {
        selected.push(edge);
      }
    }
    return selected;
  }

  private areSelectionsEqual(ids1: string[], ids2: string[]): boolean {
    if (ids1.length !== ids2.length) {
      return false;
    }

    const set1 = new Set(ids1);
    const set2 = new Set(ids2);

    return set1.size === set2.size && [...set1].every((id) => set2.has(id));
  }
}
