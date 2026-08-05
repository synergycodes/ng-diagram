/* eslint-disable @typescript-eslint/no-empty-function */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FlowCore } from '../../../flow-core';
import type {
  Edge,
  EnvironmentInfo,
  Metadata,
  Middleware,
  ModelActionTypes,
  ModelAdapter,
  Node,
  Renderer,
} from '../../../types';
import { macrotask, mockEnvironment } from '../../../test-utils';
import { InputEventsRouter } from '../../input-events.router';
import type { InputEventName, InputModifiers } from '../../input-events.interface';

/**
 * Integration tests for cancelActiveInteraction() using a real FlowCore —
 * real middleware pipeline, transaction manager, command handler and event
 * manager. The per-handler unit tests all mock these collaborators, so this
 * file is what actually verifies that a cancelled gesture rolls back through
 * the merged `cancelDrag`/`cancelResize`/`cancelRotate` transaction and that
 * the "ended" events fire with the `cancelled` reason and restored geometry.
 */

class TestInputEventsRouter extends InputEventsRouter {}

const environment: EnvironmentInfo = {
  ...mockEnvironment,
  now: () => 0,
  generateId: (() => {
    let i = 0;
    return () => `generated-${i++}`;
  })(),
};

const modifiers: InputModifiers = { primary: false, secondary: false, shift: false, meta: false };

let eventId = 0;
/** Emits a gesture phase with the shared boilerplate fields filled in. */
const emitGesture = (router: InputEventsRouter, event: { name: InputEventName } & Record<string, unknown>) =>
  router.emit({ id: `e${++eventId}`, timestamp: 0, modifiers, ...event });

function createModelAdapter(nodes: Node[], edges: Edge[] = []): ModelAdapter {
  let state = { nodes, edges, metadata: { viewport: { x: 0, y: 0, scale: 1 } } as Metadata };
  const callbacks = new Set<(changes: { nodes: Node[]; edges: Edge[]; metadata: Metadata }) => void>();
  const notify = () => callbacks.forEach((cb) => cb({ ...state }));

  return {
    destroy: () => {},
    getNodes: () => state.nodes,
    getEdges: () => state.edges,
    getMetadata: () => state.metadata,
    updateNodes: (nodesOrFn: Node[] | ((nodes: Node[]) => Node[])) => {
      state = { ...state, nodes: typeof nodesOrFn === 'function' ? nodesOrFn(state.nodes) : nodesOrFn };
      notify();
    },
    updateEdges: (edgesOrFn: Edge[] | ((edges: Edge[]) => Edge[])) => {
      state = { ...state, edges: typeof edgesOrFn === 'function' ? edgesOrFn(state.edges) : edgesOrFn };
      notify();
    },
    updateMetadata: (metadataOrFn: Metadata | ((metadata: Metadata) => Metadata)) => {
      state = {
        ...state,
        metadata: typeof metadataOrFn === 'function' ? metadataOrFn(state.metadata) : metadataOrFn,
      };
      notify();
    },
    onChange: (cb) => callbacks.add(cb),
    unregisterOnChange: (cb) => callbacks.delete(cb),
    undo: () => {},
    redo: () => {},
    toJSON: () => JSON.stringify(state),
  };
}

function createFlowCore(nodes: Node[], edges: Edge[] = []) {
  const renderer: Renderer = { draw: vi.fn() };
  const router = new TestInputEventsRouter();
  const flowCore = new FlowCore(createModelAdapter(nodes, edges), renderer, router, environment);

  const observedActionTypes: ModelActionTypes[] = [];
  const spyMiddleware: Middleware = {
    name: 'action-type-spy',
    execute: (context, next) => {
      observedActionTypes.push([...context.modelActionTypes]);
      next();
    },
  };
  flowCore.middlewareManager.register(spyMiddleware);

  return { flowCore, router, observedActionTypes };
}

const draggableNode = (overrides: Partial<Node> = {}): Node => ({
  id: 'n1',
  type: 'node',
  selected: true,
  position: { x: 10, y: 20 },
  data: {},
  ...overrides,
});

/** Starts a drag on `node` and moves it past the threshold to (150,180). */
const startDrag = async (flowCore: FlowCore, router: InputEventsRouter, node: Node) => {
  emitGesture(router, {
    name: 'pointerMoveSelection',
    phase: 'start',
    target: node,
    targetType: 'node',
    lastInputPoint: { x: 100, y: 100 },
    panningForce: null,
  });
  await emitGesture(router, {
    name: 'pointerMoveSelection',
    phase: 'continue',
    target: node,
    targetType: 'node',
    lastInputPoint: { x: 150, y: 180 },
    panningForce: null,
  });
  await macrotask();
};

describe('cancelActiveInteraction (integration)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false and emits nothing when no gesture is active', async () => {
    const { flowCore, observedActionTypes } = createFlowCore([draggableNode()]);

    const result = await flowCore.cancelActiveInteraction();

    expect(result).toBe(false);
    expect(flowCore.hasActiveInteraction()).toBe(false);
    expect(observedActionTypes).toHaveLength(0);
  });

  describe('drag', () => {
    it('rolls the dragged node back and emits nodeDragEnded with the cancelled reason', async () => {
      const node = draggableNode();
      const { flowCore, router, observedActionTypes } = createFlowCore([node]);
      const dragEnded = vi.fn();
      flowCore.eventManager.on('nodeDragEnded', dragEnded);

      await startDrag(flowCore, router, node);
      expect(flowCore.getNodeById('n1')?.position).toEqual({ x: 60, y: 100 });
      expect(flowCore.hasActiveInteraction()).toBe(true);

      observedActionTypes.length = 0;
      const result = await flowCore.cancelActiveInteraction();

      expect(result).toBe(true);
      expect(flowCore.getNodeById('n1')?.position).toEqual({ x: 10, y: 20 });
      expect(flowCore.actionStateManager.isDragging()).toBe(false);
      expect(flowCore.hasActiveInteraction()).toBe(false);

      expect(dragEnded).toHaveBeenCalledTimes(1);
      const payload = dragEnded.mock.calls[0][0];
      expect(payload.cancelReason).toBe('cancelled');
      expect(payload.nodes[0].position).toEqual({ x: 10, y: 20 });

      // The rollback must land as ONE update whose action types carry the
      // cancelDrag marker alongside the merged command types.
      expect(observedActionTypes).toHaveLength(1);
      expect(observedActionTypes[0]).toContain('cancelDrag');
      expect(observedActionTypes[0]).toContain('moveNodesStop');
    });

    it('does not add a cancel reason to a normally-ended drag', async () => {
      const node = draggableNode();
      const { flowCore, router } = createFlowCore([node]);
      const dragEnded = vi.fn();
      flowCore.eventManager.on('nodeDragEnded', dragEnded);

      await startDrag(flowCore, router, node);
      await emitGesture(router, {
        name: 'pointerMoveSelection',
        phase: 'end',
        target: node,
        targetType: 'node',
        lastInputPoint: { x: 150, y: 180 },
        panningForce: null,
      });
      await macrotask();

      expect(dragEnded).toHaveBeenCalledTimes(1);
      expect(dragEnded.mock.calls[0][0].cancelReason).toBeUndefined();
      expect(flowCore.getNodeById('n1')?.position).toEqual({ x: 60, y: 100 });
    });

    it('is idempotent — a second cancel is a no-op', async () => {
      const node = draggableNode();
      const { flowCore, router } = createFlowCore([node]);
      const dragEnded = vi.fn();
      flowCore.eventManager.on('nodeDragEnded', dragEnded);

      await startDrag(flowCore, router, node);
      expect(await flowCore.cancelActiveInteraction()).toBe(true);
      expect(await flowCore.cancelActiveInteraction()).toBe(false);

      expect(dragEnded).toHaveBeenCalledTimes(1);
    });
  });

  describe('resize', () => {
    it('restores size, position and autoSize and emits nodeResizeEnded with the cancelled reason', async () => {
      const node = draggableNode({ size: { width: 200, height: 100 }, autoSize: true });
      const { flowCore, router, observedActionTypes } = createFlowCore([node]);
      const resizeEnded = vi.fn();
      flowCore.eventManager.on('nodeResizeEnded', resizeEnded);

      await emitGesture(router, {
        name: 'resize',
        phase: 'start',
        target: node,
        targetType: 'node',
        direction: 'bottom-right',
        lastInputPoint: { x: 100, y: 100 },
      });
      await emitGesture(router, {
        name: 'resize',
        phase: 'continue',
        target: node,
        targetType: 'node',
        direction: 'bottom-right',
        lastInputPoint: { x: 150, y: 140 },
      });
      await macrotask();

      const resized = flowCore.getNodeById('n1');
      expect(resized?.size).toEqual({ width: 250, height: 140 });
      expect(resized?.autoSize).toBe(false);

      observedActionTypes.length = 0;
      const result = await flowCore.cancelActiveInteraction();

      expect(result).toBe(true);
      const restored = flowCore.getNodeById('n1');
      expect(restored?.size).toEqual({ width: 200, height: 100 });
      expect(restored?.position).toEqual({ x: 10, y: 20 });
      expect(restored?.autoSize).toBe(true);
      expect(flowCore.actionStateManager.isResizing()).toBe(false);

      expect(resizeEnded).toHaveBeenCalledTimes(1);
      expect(resizeEnded.mock.calls[0][0].cancelReason).toBe('cancelled');
      expect(resizeEnded.mock.calls[0][0].node.size).toEqual({ width: 200, height: 100 });

      expect(observedActionTypes).toHaveLength(1);
      expect(observedActionTypes[0]).toContain('cancelResize');
      expect(observedActionTypes[0]).toContain('resizeNodeStop');
    });
  });

  describe('rotate', () => {
    it('restores the angle and emits nodeRotateEnded with the cancelled reason', async () => {
      const node = draggableNode({
        angle: 30,
        size: { width: 100, height: 50 },
        measuredBounds: { x: 10, y: 20, width: 100, height: 50 },
      });
      const { flowCore, router, observedActionTypes } = createFlowCore([node]);
      const rotateEnded = vi.fn();
      flowCore.eventManager.on('nodeRotateEnded', rotateEnded);

      await emitGesture(router, {
        name: 'rotate',
        phase: 'start',
        target: node,
        targetType: 'node',
        center: { x: 60, y: 45 },
        lastInputPoint: { x: 200, y: 45 },
      });
      await emitGesture(router, {
        name: 'rotate',
        phase: 'continue',
        target: node,
        targetType: 'node',
        center: { x: 60, y: 45 },
        lastInputPoint: { x: 60, y: 200 },
      });
      await macrotask();

      expect(flowCore.getNodeById('n1')?.angle).not.toBe(30);
      expect(flowCore.actionStateManager.isRotating()).toBe(true);

      observedActionTypes.length = 0;
      const result = await flowCore.cancelActiveInteraction();

      expect(result).toBe(true);
      expect(flowCore.getNodeById('n1')?.angle).toBe(30);
      expect(flowCore.actionStateManager.isRotating()).toBe(false);

      expect(rotateEnded).toHaveBeenCalledTimes(1);
      expect(rotateEnded.mock.calls[0][0].cancelReason).toBe('cancelled');

      expect(observedActionTypes).toHaveLength(1);
      expect(observedActionTypes[0]).toContain('cancelRotate');
      expect(observedActionTypes[0]).toContain('rotateNodeStop');
    });
  });

  describe('linking', () => {
    it('discards the temporary edge and emits edgeDrawEnded with the cancelled reason', async () => {
      const node = draggableNode();
      const { flowCore, router } = createFlowCore([node]);
      const edgeDrawEnded = vi.fn();
      flowCore.eventManager.on('edgeDrawEnded', edgeDrawEnded);

      emitGesture(router, {
        name: 'linking',
        phase: 'start',
        target: node,
        targetType: 'node',
        portId: undefined,
        lastInputPoint: { x: 10, y: 20 },
      });
      await macrotask();
      emitGesture(router, {
        name: 'linking',
        phase: 'continue',
        target: node,
        targetType: 'node',
        portId: undefined,
        lastInputPoint: { x: 120, y: 90 },
      });
      await macrotask();

      expect(flowCore.actionStateManager.isLinking()).toBe(true);

      const result = await flowCore.cancelActiveInteraction();

      expect(result).toBe(true);
      expect(flowCore.actionStateManager.isLinking()).toBe(false);
      expect(flowCore.getState().edges).toHaveLength(0);

      expect(edgeDrawEnded).toHaveBeenCalledTimes(1);
      const payload = edgeDrawEnded.mock.calls[0][0];
      expect(payload.success).toBe(false);
      expect(payload.reason).toBe('cancelled');
    });
  });

  describe('panning', () => {
    it('stops panning without rolling back the viewport', async () => {
      const { flowCore, router } = createFlowCore([draggableNode({ selected: false })]);

      emitGesture(router, {
        name: 'panning',
        phase: 'start',
        target: undefined,
        targetType: 'diagram',
        lastInputPoint: { x: 100, y: 100 },
      });
      await emitGesture(router, {
        name: 'panning',
        phase: 'continue',
        target: undefined,
        targetType: 'diagram',
        lastInputPoint: { x: 130, y: 110 },
      });
      await macrotask();

      const viewportAfterPan = { ...flowCore.getState().metadata.viewport };
      expect(flowCore.actionStateManager.isPanning()).toBe(true);

      const result = await flowCore.cancelActiveInteraction();

      expect(result).toBe(true);
      expect(flowCore.actionStateManager.isPanning()).toBe(false);
      // Viewport is navigation state — deliberately NOT rolled back.
      expect(flowCore.getState().metadata.viewport).toEqual(viewportAfterPan);
    });
  });

  describe('cancel vs concurrent work', () => {
    it('refuses to cancel a drag whose pointerup end is already in flight', async () => {
      const node = draggableNode();
      const { flowCore, router } = createFlowCore([node]);
      const dragEnded = vi.fn();
      flowCore.eventManager.on('nodeDragEnded', dragEnded);

      // Parks the end's moveNodesStop pass so the cancel arrives mid-end
      let release: () => void = () => undefined;
      flowCore.middlewareManager.register({
        name: 'slow-stop',
        execute: async (context, next) => {
          if (context.modelActionTypes.includes('moveNodesStop')) {
            await new Promise<void>((resolve) => {
              release = resolve;
            });
          }
          await next();
        },
      });

      await startDrag(flowCore, router, node);
      const endPromise = emitGesture(router, {
        name: 'pointerMoveSelection',
        phase: 'end',
        target: node,
        targetType: 'node',
        lastInputPoint: { x: 150, y: 180 },
        panningForce: null,
      });
      await macrotask();

      expect(await flowCore.cancelActiveInteraction()).toBe(false);

      release();
      await endPromise;
      await macrotask();

      // The completed drop stands: one normally-labeled ended event, no rollback
      expect(flowCore.getNodeById('n1')?.position).toEqual({ x: 60, y: 100 });
      expect(dragEnded).toHaveBeenCalledTimes(1);
      expect(dragEnded.mock.calls[0][0].cancelReason).toBeUndefined();
    });

    it('refuses to cancel while a transaction is active, works after it settles', async () => {
      const node = draggableNode();
      const { flowCore, router } = createFlowCore([node]);
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      await startDrag(flowCore, router, node);

      let releaseTx: () => void = () => undefined;
      const txPromise = flowCore.transaction('appTransaction', async () => {
        await new Promise<void>((resolve) => {
          releaseTx = resolve;
        });
      });
      await macrotask();

      expect(await flowCore.cancelActiveInteraction()).toBe(false);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('cancelActiveInteraction'));
      expect(flowCore.actionStateManager.isDragging()).toBe(true);
      expect(flowCore.getNodeById('n1')?.position).toEqual({ x: 60, y: 100 });

      releaseTx();
      await txPromise;

      expect(await flowCore.cancelActiveInteraction()).toBe(true);
      expect(flowCore.getNodeById('n1')?.position).toEqual({ x: 10, y: 20 });
      warn.mockRestore();
    });

    it('a concurrent second cancel is a no-op', async () => {
      const node = draggableNode();
      const { flowCore, router } = createFlowCore([node]);
      const dragEnded = vi.fn();
      flowCore.eventManager.on('nodeDragEnded', dragEnded);

      await startDrag(flowCore, router, node);
      const [first, second] = await Promise.all([
        flowCore.cancelActiveInteraction(),
        flowCore.cancelActiveInteraction(),
      ]);

      expect(first).toBe(true);
      expect(second).toBe(false);
      expect(dragEnded).toHaveBeenCalledTimes(1);
      expect(flowCore.getNodeById('n1')?.position).toEqual({ x: 10, y: 20 });
    });

    it('drag cancel restores group children moved with the group', async () => {
      const group = draggableNode({ id: 'grp', position: { x: 100, y: 100 }, isGroup: true });
      const child = draggableNode({ id: 'child', selected: false, groupId: 'grp', position: { x: 120, y: 130 } });
      const { flowCore, router } = createFlowCore([group, child]);

      await startDrag(flowCore, router, group);
      expect(flowCore.getNodeById('grp')?.position).toEqual({ x: 150, y: 180 });
      expect(flowCore.getNodeById('child')?.position).toEqual({ x: 170, y: 210 });

      expect(await flowCore.cancelActiveInteraction()).toBe(true);

      expect(flowCore.getNodeById('grp')?.position).toEqual({ x: 100, y: 100 });
      expect(flowCore.getNodeById('child')?.position).toEqual({ x: 120, y: 130 });
    });
  });
});
