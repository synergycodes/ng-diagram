import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { SelectionMovedEvent } from '../../../../../event-manager/event-types';
import { mockNode } from '../../../../../test-utils';
import type { MiddlewareContext, Node } from '../../../../../types';
import { SelectionMovedEmitter } from '../selection-moved.emitter';

describe('SelectionMovedEmitter', () => {
  let emitter: SelectionMovedEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new SelectionMovedEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'moveNodes',
      initialNodesMap: new Map<string, Node>(),
      nodesMap: new Map<string, Node>(),
      initialUpdate: {},
      history: [],
    } as unknown as MiddlewareContext;
  });

  describe('modelActionType filtering', () => {
    it('should not emit event when modelActionType is not a move action', () => {
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 100 } }],
      };

      const node: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
      context.initialNodesMap.set('node1', { ...mockNode, id: 'node1', position: { x: 0, y: 0 } });
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit event for moveNodes action', () => {
      context.modelActionType = 'moveNodes';
      testMoveAction(context, emitter, eventManager, emitSpy);
    });

    it('should emit event for moveNodesBy action', () => {
      context.modelActionType = 'moveNodesBy';
      testMoveAction(context, emitter, eventManager, emitSpy);
    });
  });

  it('should not emit event when no nodes were updated', () => {
    context.initialUpdate = {};
    context.history = [];

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit event when node position has not changed', () => {
    const node: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 100 } }],
    };
    context.initialNodesMap.set('node1', node);
    context.nodesMap.set('node1', node);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should emit event when single node is moved', () => {
    const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 100 } }],
    };
    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should emit event when multiple nodes are moved', () => {
    const initialNode1: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
    const initialNode2: Node = { ...mockNode, id: 'node2', position: { x: 50, y: 50 } };
    const movedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
    const movedNode2: Node = { ...mockNode, id: 'node2', position: { x: 150, y: 150 } };

    context.initialUpdate = {
      nodesToUpdate: [
        { id: 'node1', position: { x: 100, y: 100 } },
        { id: 'node2', position: { x: 150, y: 150 } },
      ],
    };
    context.initialNodesMap.set('node1', initialNode1);
    context.initialNodesMap.set('node2', initialNode2);
    context.nodesMap.set('node1', movedNode1);
    context.nodesMap.set('node2', movedNode2);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode1, movedNode2],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should emit event when node is moved only horizontally', () => {
    const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 100 } };
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 200, y: 100 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 200, y: 100 } }],
    };
    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should emit event when node is moved only vertically', () => {
    const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 0 } };
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 200 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 200 } }],
    };
    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should handle nodes with negative positions', () => {
    const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: -50, y: -75 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: -50, y: -75 } }],
    };
    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should collect node IDs from history', () => {
    const initialNode1: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
    const initialNode2: Node = { ...mockNode, id: 'node2', position: { x: 0, y: 0 } };
    const movedNode1: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
    const movedNode2: Node = { ...mockNode, id: 'node2', position: { x: 200, y: 200 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 100 } }],
    };
    context.history = [
      {
        stateUpdate: {
          nodesToUpdate: [{ id: 'node2', position: { x: 200, y: 200 } }],
        },
      },
    ] as MiddlewareContext['history'];

    context.initialNodesMap.set('node1', initialNode1);
    context.initialNodesMap.set('node2', initialNode2);
    context.nodesMap.set('node1', movedNode1);
    context.nodesMap.set('node2', movedNode2);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode1, movedNode2],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should handle duplicate node IDs in updates', () => {
    const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

    context.initialUpdate = {
      nodesToUpdate: [
        { id: 'node1', position: { x: 50, y: 50 } },
        { id: 'node1', position: { x: 100, y: 100 } },
      ],
    };
    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should not emit for nodes that exist in updates but not in nodesMap', () => {
    const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

    context.initialUpdate = {
      nodesToUpdate: [
        { id: 'node1', position: { x: 100, y: 100 } },
        { id: 'node2', position: { x: 200, y: 200 } }, // node2 doesn't exist
      ],
    };
    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });

  it('should not emit for nodes without position property', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nodeWithoutPosition: Node = { ...mockNode, id: 'node1', position: undefined } as any;

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1' }],
    };
    context.initialNodesMap.set('node1', nodeWithoutPosition);
    context.nodesMap.set('node1', nodeWithoutPosition);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should not emit when initial node is missing from initialNodesMap', () => {
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 100 } }],
    };
    // Don't add to initialNodesMap
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('should handle minimal position changes', () => {
    const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };
    const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 100.0001, y: 100 } };

    context.initialUpdate = {
      nodesToUpdate: [{ id: 'node1', position: { x: 100.0001, y: 100 } }],
    };
    context.initialNodesMap.set('node1', initialNode);
    context.nodesMap.set('node1', movedNode);

    emitter.emit(context, eventManager);

    const expectedEvent: SelectionMovedEvent = {
      nodes: [movedNode],
    };

    expect(emitSpy).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
  });
});

function testMoveAction(
  context: MiddlewareContext,
  emitter: SelectionMovedEmitter,
  eventManager: EventManager,
  emitSpy: ReturnType<typeof vi.fn>
) {
  const initialNode: Node = { ...mockNode, id: 'node1', position: { x: 0, y: 0 } };
  const movedNode: Node = { ...mockNode, id: 'node1', position: { x: 100, y: 100 } };

  context.initialUpdate = {
    nodesToUpdate: [{ id: 'node1', position: { x: 100, y: 100 } }],
  };
  context.initialNodesMap.set('node1', initialNode);
  context.nodesMap.set('node1', movedNode);

  emitter.emit(context, eventManager);

  const expectedEvent: SelectionMovedEvent = {
    nodes: [movedNode],
  };

  expect(emitSpy).toHaveBeenCalledOnce();
  expect(emitSpy).toHaveBeenCalledWith('selectionMoved', expectedEvent);
}
