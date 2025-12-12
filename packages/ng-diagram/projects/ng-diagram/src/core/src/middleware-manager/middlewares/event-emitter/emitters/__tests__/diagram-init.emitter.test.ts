/* eslint-disable @typescript-eslint/no-empty-function */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { EventManager } from '../../../../../event-manager/event-manager';
import type { DiagramInitEvent } from '../../../../../event-manager/event-types';
import { mockEdge, mockNode } from '../../../../../test-utils';
import type { Edge, EdgeLabel, MiddlewareContext, Node, Port } from '../../../../../types';
import { DiagramInitEmitter } from '../diagram-init.emitter';

describe('DiagramInitEmitter', () => {
  let emitter: DiagramInitEmitter;
  let eventManager: EventManager;
  let deferredEmitSpy: ReturnType<typeof vi.fn>;
  let emitSpy: ReturnType<typeof vi.fn>;
  let context: MiddlewareContext;

  beforeEach(() => {
    emitter = new DiagramInitEmitter();
    deferredEmitSpy = vi.fn();
    emitSpy = vi.fn();
    eventManager = {
      deferredEmit: deferredEmitSpy,
      emit: emitSpy,
    } as unknown as EventManager;

    context = {
      modelActionType: 'init',
      modelActionTypes: ['init'],
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should emit immediately since node is already measured
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      const event = deferredEmitSpy.mock.calls[0][1] as DiagramInitEvent;
      expect(event.nodes).toHaveLength(1);
      expect(event.edges).toHaveLength(0);
    });

    it('should not emit event during init phase if items need measuring', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: undefined, // Unmeasured
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', measuredNode);
      context.nodesMap.set('node2', unmeasuredNode);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Now simulate updateNode to provide measurements
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node2', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all nodes are measured
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      const event = deferredEmitSpy.mock.calls[0][1] as DiagramInitEvent;
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Now simulate updateNode to provide port measurements
      context.modelActionTypes = ['updateNode'];
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
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Now simulate updateEdge to provide label measurements
      context.modelActionTypes = ['updateEdge'];
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
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('zero size validation', () => {
    it('should treat node with 0 width or height as unmeasured', () => {
      const nodeWithZeroWidth: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 0, height: 50 },
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', nodeWithZeroWidth);

      emitter.emit(context, eventManager);

      // Should not emit - width is 0
      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update with valid width
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should not emit - port width is 0
      expect(deferredEmitSpy).not.toHaveBeenCalled();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should emit - position (0, 0) is valid
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      // Should not emit - label width is 0
      expect(deferredEmitSpy).not.toHaveBeenCalled();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      // Should emit - position (0, 0) is valid
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node1);
      context.nodesMap.set('node2', node2);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update first node
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should not emit yet - node2 is still unmeasured
      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update second node
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node2', size: { width: 150, height: 75 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now that all nodes are measured
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
    });

    it('should handle partial node measurements', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        size: { width: undefined as any, height: 50 },
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update with only width
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: undefined as any } }],
      };

      emitter.emit(context, eventManager);

      // Should not emit - height is still undefined
      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update with both width and height
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update both ports
      context.modelActionTypes = ['updateNode'];
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
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update both labels
      context.modelActionTypes = ['updateEdge'];
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
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
    });
  });

  describe('edge cases', () => {
    it('should not emit before initialization', () => {
      // Don't call init first
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();
    });

    it('should emit only once', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // First updateNode should trigger the event
      context.modelActionTypes = ['updateNode'];
      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).toHaveBeenCalledOnce();

      // Subsequent updates should not trigger the event
      context.modelActionTypes = ['updateNode'];
      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).toHaveBeenCalledOnce();
    });

    it('should handle empty diagram', () => {
      context.modelActionTypes = ['init'];
      // No nodes or edges

      emitter.emit(context, eventManager);

      // Should emit immediately during init for empty diagram
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      const event = deferredEmitSpy.mock.calls[0][1] as DiagramInitEvent;
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);
      context.edgesMap.set('edge1', edge);

      emitter.emit(context, eventManager);

      // Should emit immediately during init as there are no ports/labels to measure and node is measured
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
    });

    it('should skip non-existent nodes in updateNode', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should have already emitted during init as all existing nodes are measured
      expect(deferredEmitSpy).toHaveBeenCalledOnce();

      // Update with non-existent node
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'non-existent', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should still only be called once (from init)
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
    });

    it('should skip non-existent edges in updateEdge', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should have already emitted during init as node is measured and there are no edges
      expect(deferredEmitSpy).toHaveBeenCalledOnce();

      // Update with non-existent edge
      context.modelActionTypes = ['updateEdge'];
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
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', measuredNode);
      context.nodesMap.set('node2', unmeasuredNode);
      context.nodesMap.set('node3', nodeWithUnmeasuredPort);
      context.edgesMap.set('edge1', edgeWithUnmeasuredLabel);

      emitter.emit(context, eventManager);

      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update node2
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node2', size: { width: 150, height: 75 } }],
      };
      emitter.emit(context, eventManager);
      expect(deferredEmitSpy).not.toHaveBeenCalled();

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
      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Update label1
      context.modelActionTypes = ['updateEdge'];
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
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      const event = deferredEmitSpy.mock.calls[0][1] as DiagramInitEvent;
      expect(event.nodes).toHaveLength(3);
      expect(event.edges).toHaveLength(1);
    });
  });

  describe('safety hatch', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should not start timeout if all items are measured on init', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: { width: 100, height: 50 },
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should emit immediately
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance time to check timeout doesn't trigger
      vi.advanceTimersByTime(5000);

      // Should still only be called once
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit event after timeout if items remain unmeasured', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: undefined,
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should not emit yet
      expect(deferredEmitSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance time past the timeout (3000ms)
      vi.advanceTimersByTime(3000);

      // Should emit now via safety hatch using immediate emit (not deferred)
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(deferredEmitSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should clear timeout if all items are measured before timeout', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: undefined,
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Should not emit yet
      expect(deferredEmitSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance time partially
      vi.advanceTimersByTime(1000);

      // Update node to complete measurements
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should emit now
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance time past original timeout
      vi.advanceTimersByTime(5000);

      // Should still only be called once (timeout was cleared)
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should reset timeout when measurement progress is made', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node1);
      context.nodesMap.set('node2', node2);

      emitter.emit(context, eventManager);

      // Should not emit yet
      expect(deferredEmitSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance time to 1.5 seconds (before timeout)
      vi.advanceTimersByTime(1500);

      // Update first node - this should reset the timeout
      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should not emit yet (node2 still unmeasured)
      expect(deferredEmitSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance another 1.5 seconds (would be past original timeout, but timeout was reset)
      vi.advanceTimersByTime(1500);

      // Should still not emit (only 1.5s since last progress)
      expect(deferredEmitSpy).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance final 500ms to trigger new timeout
      vi.advanceTimersByTime(500);

      // Now safety hatch should trigger using immediate emit (not deferred)
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(deferredEmitSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should log detailed warnings when safety hatch triggers', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const unmeasuredNode: Node = {
        ...mockNode,
        id: 'node1',
        size: undefined,
      };

      const nodeWithUnmeasuredPort: Node = {
        ...mockNode,
        id: 'node2',
        size: { width: 100, height: 50 },
        measuredPorts: [
          {
            id: 'port1',
            type: 'both',
            side: 'left',
            position: undefined,
            size: undefined,
            nodeId: 'node2',
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

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', unmeasuredNode);
      context.nodesMap.set('node2', nodeWithUnmeasuredPort);
      context.edgesMap.set('edge1', edgeWithUnmeasuredLabel);

      emitter.emit(context, eventManager);

      // Advance past timeout
      vi.advanceTimersByTime(3000);

      // Should emit via safety hatch using immediate emit (not deferred)
      expect(emitSpy).toHaveBeenCalledOnce();
      expect(deferredEmitSpy).not.toHaveBeenCalled();

      // Check console warnings were called
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it('should not emit twice if safety hatch triggers after event already emitted', () => {
      const node: Node = {
        ...mockNode,
        id: 'node1',
        size: undefined,
      };

      context.modelActionTypes = ['init'];
      context.nodesMap.set('node1', node);

      emitter.emit(context, eventManager);

      // Update node before timeout
      vi.advanceTimersByTime(1000);

      context.modelActionTypes = ['updateNode'];
      context.initialUpdate = {
        nodesToUpdate: [{ id: 'node1', size: { width: 100, height: 50 } }],
      };

      emitter.emit(context, eventManager);

      // Should have emitted once
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).not.toHaveBeenCalled();

      // Advance past timeout
      vi.advanceTimersByTime(5000);

      // Should still only be called once
      expect(deferredEmitSpy).toHaveBeenCalledOnce();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });
});
