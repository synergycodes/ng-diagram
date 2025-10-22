import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { DiagramInitEvent } from '../../../../../event-manager/event-types';
import { mockEdge, mockNode } from '../../../../../test-utils';
import type { Edge, EdgeLabel, MiddlewareContext, Node, Port } from '../../../../../types';
import { DiagramInitEmitter } from '../diagram-init.emitter';

describe('DiagramInitEmitter', () => {
  let emitter: DiagramInitEmitter;
  let eventManager: EventManager;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new DiagramInitEmitter();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'init',
      nodesMap: new Map<string, Node>(),
      edgesMap: new Map<string, Edge>(),
      state: {
        metadata: {
          viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600 },
        },
      },
      initialUpdate: {},
    } as unknown as MiddlewareContext;
  });

  describe('init phase', () => {
    it('should emit event during init phase if all items are already measured', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should emit immediately since node is already measured
      expect(emitSpy).toHaveBeenCalledOnce();
      const event = emitSpy.mock.calls[0][1] as DiagramInitEvent;
      expect(event.nodes).toHaveLength(1);
      expect(event.edges).toHaveLength(0);
    });

    it('should not emit event during init phase if items need measuring', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: undefined, // Unmeasured
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should track unmeasured nodes during init', () => {
      const measuredNode: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };
      const unmeasuredNode: Node = {
        ...mockNode,
        id: 'node2',
        size: undefined,
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', measuredNode);
      context.nodesMap.set('node2', unmeasuredNode);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Now simulate updateNode to provide measurements
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node2', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all nodes are measured
      expect(emitSpy).toHaveBeenCalledOnce();
      const event = emitSpy.mock.calls[0][1] as DiagramInitEvent;
      expect(event.nodes).toHaveLength(2);
      expect(event.edges).toHaveLength(0);
    });

    it('should track unmeasured ports during init', () => {
      const unmeasuredPort: Port = {
        id: 'port1',
        type: 'both',
        side: 'left',
        position: undefined,
        size: undefined,
        nodeId: 'node1',
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
        measuredPorts: [unmeasuredPort],
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Now simulate updateNode to provide port measurements
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [
          {
            id: 'node1',
            measuredPorts: [
              {
                id: 'port1',
                type: 'both',
                side: 'left',
                nodeId: 'node1',
                position: { x: 10, y: 25 },
                size: { width: 10, height: 10 },
              },
            ],
          },
        ],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all ports are measured
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should track unmeasured edge labels during init', () => {
      const unmeasuredLabel: EdgeLabel = {
        id: 'label1',
        position: undefined,
        size: undefined,
        positionOnEdge: 0.5,
      };

      const edge: Edge = {
        ...mockEdge,
        id: 'edge1',
        measuredLabels: [unmeasuredLabel],
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Now simulate updateEdge to provide label measurements
      context.modelActionType = 'updateEdge';
      context.initialUpdate = {
        edgesToUpdate: [
          {
            id: 'edge1',
            measuredLabels: [
              {
                id: 'label1',
                position: { x: 50, y: 50 },
                size: { width: 40, height: 20 },
                positionOnEdge: 0.5,
              },
            ],
          },
        ],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all labels are measured
      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('zero size validation', () => {
    it('should treat node with 0 width or height as unmeasured', () => {
      const nodeWithZeroWidth: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 0, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', nodeWithZeroWidth);

      emitter.emit(context, eventManager);

      // Should not emit - width is 0
      expect(emitSpy).not.toHaveBeenCalled();

      // Update with valid width
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should treat port with 0 size as unmeasured', () => {
      const portWithZeroSize: Port = {
        id: 'port1',
        type: 'both',
        side: 'left',
        position: { x: 10, y: 25 },
        size: { width: 0, height: 10 },
        nodeId: 'node1',
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
        measuredPorts: [portWithZeroSize],
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should not emit - port width is 0
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should accept port position with 0 coordinates as valid', () => {
      const portAtOrigin: Port = {
        id: 'port1',
        type: 'both',
        side: 'left',
        position: { x: 0, y: 0 },
        size: { width: 10, height: 10 },
        nodeId: 'node1',
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
        measuredPorts: [portAtOrigin],
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should emit - position (0, 0) is valid
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should treat label with 0 size as unmeasured', () => {
      const labelWithZeroSize: EdgeLabel = {
        id: 'label1',
        position: { x: 50, y: 50 },
        size: { width: 0, height: 20 },
        positionOnEdge: 0.5,
      };

      const edge: Edge = {
        ...mockEdge,
        id: 'edge1',
        measuredLabels: [labelWithZeroSize],
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      // Should not emit - label width is 0
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should accept label position with 0 coordinates as valid', () => {
      const labelAtOrigin: EdgeLabel = {
        id: 'label1',
        position: { x: 0, y: 0 },
        size: { width: 40, height: 20 },
        positionOnEdge: 0.5,
      };

      const edge: Edge = {
        ...mockEdge,
        id: 'edge1',
        measuredLabels: [labelAtOrigin],
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      // Should emit - position (0, 0) is valid
      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('measurement updates', () => {
    it('should emit event after all nodes are measured', () => {
      const node1: Node = {
        ...mockNode,
        id: 'node1',
        size: undefined,
      };
      const node2: Node = {
        ...mockNode,
        id: 'node2',
        size: undefined,
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node1);
      context.nodesMap.set('node2', node2);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Update first node
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should not emit yet - node2 is still unmeasured
      expect(emitSpy).not.toHaveBeenCalled();

      // Update second node
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node2', size: { width: 150, height: 75 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all nodes are measured
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should handle partial node measurements', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        size: { width: undefined as any, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Update with only width
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: undefined as any } }],
      };

      emitter.emit(context, eventManager);

      // Should not emit - height is still undefined
      expect(emitSpy).not.toHaveBeenCalled();

      // Update with both width and height
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should handle multiple port updates', () => {
      const port1: Port = {
        id: 'port1',
        type: 'both',
        side: 'left',
        position: undefined,
        size: undefined,
        nodeId: 'node1',
      };
      const port2: Port = {
        id: 'port2',
        type: 'both',
        side: 'right',
        position: undefined,
        size: undefined,
        nodeId: 'node1',
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
        measuredPorts: [port1, port2],
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Update both ports
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [
          {
            id: 'node1',
            measuredPorts: [
              {
                id: 'port1',
                type: 'both',
                side: 'left',
                nodeId: 'node1',
                position: { x: 0, y: 25 },
                size: { width: 10, height: 10 },
              },
              {
                id: 'port2',
                type: 'both',
                side: 'right',
                nodeId: 'node1',
                position: { x: 90, y: 25 },
                size: { width: 10, height: 10 },
              },
            ],
          },
        ],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all ports are measured
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should handle multiple label updates', () => {
      const label1: EdgeLabel = {
        id: 'label1',
        position: undefined,
        size: undefined,
        positionOnEdge: 0.3,
      };
      const label2: EdgeLabel = {
        id: 'label2',
        position: undefined,
        size: undefined,
        positionOnEdge: 0.7,
      };

      const edge: Edge = {
        ...mockEdge,
        id: 'edge1',
        measuredLabels: [label1, label2],
      };

      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Update both labels
      context.modelActionType = 'updateEdge';
      context.initialUpdate = {
        edgesToUpdate: [
          {
            id: 'edge1',
            measuredLabels: [
              {
                id: 'label1',
                position: { x: 30, y: 30 },
                size: { width: 40, height: 20 },
                positionOnEdge: 0.3,
              },
              {
                id: 'label2',
                position: { x: 70, y: 70 },
                size: { width: 40, height: 20 },
                positionOnEdge: 0.7,
              },
            ],
          },
        ],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all labels are measured
      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('edge cases', () => {
    it('should not emit before initialization', () => {
      // Don't call init first
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit only once', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // First updateNode should trigger the event
      context.modelActionType = 'updateNode';
      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();

      // Subsequent updates should not trigger the event
      context.modelActionType = 'updateNode';
      emitter.emit(context, eventManager);

      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should handle empty diagram', () => {
      context.modelActionType = 'init';
      // No nodes or edges

      emitter.emit(context, eventManager);

      // Should emit immediately during init for empty diagram
      expect(emitSpy).toHaveBeenCalledOnce();
      const event = emitSpy.mock.calls[0][1] as DiagramInitEvent;
      expect(event.nodes).toHaveLength(0);
      expect(event.edges).toHaveLength(0);
      expect(event.viewport).toBeDefined();
    });

    it('should handle nodes with no ports or edges with no labels', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
        measuredPorts: undefined,
      };
      const edge: Edge = {
        ...mockEdge,
        id: 'edge1',
        measuredLabels: undefined,
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      // Should emit immediately during init as there are no ports/labels to measure and node is measured
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should skip non-existent nodes in updateNode', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should have already emitted during init as all existing nodes are measured
      expect(emitSpy).toHaveBeenCalledOnce();

      // Update with non-existent node
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'non-existent', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should still only be called once (from init)
      expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should skip non-existent edges in updateEdge', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should have already emitted during init as node is measured and there are no edges
      expect(emitSpy).toHaveBeenCalledOnce();

      // Update with non-existent edge
      context.modelActionType = 'updateEdge';
      context.initialUpdate = {
        edgesToUpdate: [
          {
            id: 'non-existent',
            measuredLabels: [
              {
                id: 'label1',
                position: { x: 50, y: 50 },
                size: { width: 40, height: 20 },
                positionOnEdge: 0.5,
              },
            ],
          },
        ],
      };

      emitter.emit(context, eventManager);

      // Should still only be called once (from init)
      expect(emitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed measured and unmeasured items', () => {
      const measuredNode: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };
      const unmeasuredNode: Node = {
        ...mockNode,
        id: 'node2',
        size: undefined,
      };
      const nodeWithUnmeasuredPort: Node = {
        ...mockNode,
        id: 'node3',
        size: { width: 100, height: 50 },
        measuredPorts: [
          {
            id: 'port1',
            type: 'both',
            side: 'left',
            position: undefined,
            size: undefined,
            nodeId: 'node3',
          },
        ],
      };
      const edgeWithUnmeasuredLabel: Edge = {
        ...mockEdge,
        id: 'edge1',
        measuredLabels: [
          {
            id: 'label1',
            position: undefined,
            size: undefined,
            positionOnEdge: 0.5,
          },
        ],
      };

      context.modelActionType = 'init';
      context.nodesMap.set('node1', measuredNode);
      context.nodesMap.set('node2', unmeasuredNode);
      context.nodesMap.set('node3', nodeWithUnmeasuredPort);
      context.edgesMap.set('edge1', edgeWithUnmeasuredLabel);

      emitter.emit(context, eventManager);

      expect(emitSpy).not.toHaveBeenCalled();

      // Update node2
      context.modelActionType = 'updateNode';
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node2', size: { width: 150, height: 75 } }],
      };
      emitter.emit(context, eventManager);
      expect(emitSpy).not.toHaveBeenCalled();

      // Update port1
      context.initialUpdate = {
        nodesToUpdate: [
          {
            id: 'node3',
            measuredPorts: [
              {
                id: 'port1',
                type: 'both',
                side: 'left',
                nodeId: 'node3',
                position: { x: 10, y: 25 },
                size: { width: 10, height: 10 },
              },
            ],
          },
        ],
      };
      emitter.emit(context, eventManager);
      expect(emitSpy).not.toHaveBeenCalled();

      // Update label1
      context.modelActionType = 'updateEdge';
      context.initialUpdate = {
        edgesToUpdate: [
          {
            id: 'edge1',
            measuredLabels: [
              {
                id: 'label1',
                position: { x: 50, y: 50 },
                size: { width: 40, height: 20 },
                positionOnEdge: 0.5,
              },
            ],
          },
        ],
      };
      emitter.emit(context, eventManager);

      // Should emit now that everything is measured
      expect(emitSpy).toHaveBeenCalledOnce();
      const event = emitSpy.mock.calls[0][1] as DiagramInitEvent;
      expect(event.nodes).toHaveLength(3);
      expect(event.edges).toHaveLength(1);
    });
  });
});
