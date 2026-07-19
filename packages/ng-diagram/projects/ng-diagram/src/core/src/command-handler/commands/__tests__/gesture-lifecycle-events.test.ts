import { describe, expect, it } from 'vitest';
import {
  createInMemoryModelAdapter as createModelAdapter,
  createTestFlowCore as createFlowCore,
} from '../../../test-utils';
import type { DraggingActionState, Middleware, Node, ResizeActionState } from '../../../types';

const node = (id: string): Node => ({ id, type: 'node', selected: false, position: { x: 0, y: 0 }, data: {} });

const draggingOf = (nodeIds: string[], movementStarted = true): DraggingActionState => ({
  nodeIds,
  modifiers: { primary: false, secondary: false, shift: false, meta: false },
  accumulatedDeltas: new Map(),
  movementStarted,
});

describe('moveNodesStart/moveNodesStop lifecycle events', () => {
  it('should report the nodes captured at emit time even when a new gesture replaced the dragging state', async () => {
    const flowCore = createFlowCore(createModelAdapter());
    await flowCore.commandHandler.emit('addNodes', { nodes: [node('n1')] });
    const ended: string[][] = [];
    flowCore.eventManager.on('nodeDragEnded', (event) => ended.push(event.nodes.map((n) => n.id)));

    flowCore.actionStateManager.dragging = draggingOf(['n1']);
    const stop = flowCore.commandHandler.emit('moveNodesStop', { nodeIds: ['n1'] });
    // A re-drag replaces the dragging state before the stop pass runs.
    flowCore.actionStateManager.dragging = draggingOf([], false);
    await stop;

    expect(ended).toEqual([['n1']]);

    flowCore.destroy();
  });

  it('should report nodeDragStarted from the capture, not the live dragging state', async () => {
    const flowCore = createFlowCore(createModelAdapter());
    await flowCore.commandHandler.emit('addNodes', { nodes: [node('n1')] });
    const started: string[][] = [];
    flowCore.eventManager.on('nodeDragStarted', (event) => started.push(event.nodes.map((n) => n.id)));

    flowCore.actionStateManager.dragging = draggingOf(['n1']);
    const start = flowCore.commandHandler.emit('moveNodesStart', { nodeIds: ['n1'] });
    flowCore.actionStateManager.dragging = draggingOf([], false);
    await start;

    expect(started).toEqual([['n1']]);

    flowCore.destroy();
  });

  it('should fall back to the live dragging state when no capture was provided', async () => {
    const flowCore = createFlowCore(createModelAdapter());
    await flowCore.commandHandler.emit('addNodes', { nodes: [node('n1')] });
    const ended: string[][] = [];
    flowCore.eventManager.on('nodeDragEnded', (event) => ended.push(event.nodes.map((n) => n.id)));

    flowCore.actionStateManager.dragging = draggingOf(['n1']);
    await flowCore.commandHandler.emit('moveNodesStop', {});

    expect(ended).toEqual([['n1']]);

    flowCore.destroy();
  });

  it('should not let a cancelled pass leave its capture for the next one', async () => {
    let cancelStops = false;
    const cancellingMiddleware: Middleware = {
      name: 'conditional-cancel',
      execute: (context, next, cancel) => {
        if (cancelStops && context.modelActionTypes.includes('moveNodesStop')) {
          cancel();
          return;
        }
        next();
      },
    };
    const flowCore = createFlowCore(createModelAdapter(), [cancellingMiddleware]);
    await flowCore.commandHandler.emit('addNodes', { nodes: [node('n1'), node('n2')] });
    const ended: string[][] = [];
    flowCore.eventManager.on('nodeDragEnded', (event) => ended.push(event.nodes.map((n) => n.id)));

    cancelStops = true;
    await flowCore.commandHandler.emit('moveNodesStop', { nodeIds: ['n1'] });
    expect(ended).toEqual([]);

    // A leftover capture from the cancelled pass would shift onto this one and
    // mis-attribute the event to n1.
    cancelStops = false;
    await flowCore.commandHandler.emit('moveNodesStop', { nodeIds: ['n2'] });
    expect(ended).toEqual([['n2']]);

    flowCore.destroy();
  });
});

const resizeStateOf = (target: Node): ResizeActionState => ({
  startWidth: 100,
  startHeight: 100,
  startX: 0,
  startY: 0,
  startNodePositionX: 0,
  startNodePositionY: 0,
  resizingNode: target,
});

describe('resizeNodeStart/resizeNodeStop lifecycle events', () => {
  it('should report the node captured at emit time even when a re-grab replaced the resize state', async () => {
    const flowCore = createFlowCore(createModelAdapter());
    await flowCore.commandHandler.emit('addNodes', { nodes: [node('n1'), node('n2')] });
    const ended: string[] = [];
    flowCore.eventManager.on('nodeResizeEnded', (event) => ended.push(event.node.id));

    flowCore.actionStateManager.resize = resizeStateOf(node('n1'));
    const stop = flowCore.commandHandler.emit('resizeNodeStop', { nodeId: 'n1' });
    // A re-grab replaces the resize state before the stop pass runs.
    flowCore.actionStateManager.resize = resizeStateOf(node('n2'));
    await stop;

    expect(ended).toEqual(['n1']);

    flowCore.destroy();
  });

  it('should fall back to the live resize state when no capture was provided', async () => {
    const flowCore = createFlowCore(createModelAdapter());
    await flowCore.commandHandler.emit('addNodes', { nodes: [node('n1')] });
    const ended: string[] = [];
    flowCore.eventManager.on('nodeResizeEnded', (event) => ended.push(event.node.id));

    flowCore.actionStateManager.resize = resizeStateOf(node('n1'));
    await flowCore.commandHandler.emit('resizeNodeStop', {});

    expect(ended).toEqual(['n1']);

    flowCore.destroy();
  });
});

describe('rotateNodeStart/rotateNodeStop lifecycle events', () => {
  it('should report the node captured at emit time even when a re-grab replaced the rotation state', async () => {
    const flowCore = createFlowCore(createModelAdapter());
    await flowCore.commandHandler.emit('addNodes', { nodes: [node('n1'), node('n2')] });
    const ended: string[] = [];
    flowCore.eventManager.on('nodeRotateEnded', (event) => ended.push(event.node.id));

    flowCore.actionStateManager.rotation = { startAngle: 0, initialNodeAngle: 0, nodeId: 'n1' };
    const stop = flowCore.commandHandler.emit('rotateNodeStop', { nodeId: 'n1' });
    flowCore.actionStateManager.rotation = { startAngle: 0, initialNodeAngle: 0, nodeId: 'n2' };
    await stop;

    expect(ended).toEqual(['n1']);

    flowCore.destroy();
  });
});
