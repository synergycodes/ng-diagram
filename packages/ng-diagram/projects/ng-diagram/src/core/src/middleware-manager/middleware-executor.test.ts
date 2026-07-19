import { describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../flow-core';
import { mockEnvironment, mockMetadata, mockNode } from '../test-utils';
import type { Edge, FlowState, FlowStateUpdate, Middleware, MiddlewareChain, Node } from '../types';
import { MiddlewareExecutor } from './middleware-executor';

const createFlowCore = (nodes: Node[], edges: Edge[]): FlowCore =>
  ({
    modelLookup: {
      nodesMap: new Map(nodes.map((node) => [node.id, node])),
      edgesMap: new Map(edges.map((edge) => [edge.id, edge])),
      connectedEdgesMap: new Map<string, string[]>(),
    },
    actionStateManager: {},
    edgeRoutingManager: {},
    config: {},
    environment: mockEnvironment,
  }) as unknown as FlowCore;

const runExecutor = (options: {
  chain: Middleware[];
  update: FlowStateUpdate;
  nodes?: Node[];
  edges?: Edge[];
}): Promise<FlowState | undefined> => {
  const nodes = options.nodes ?? [];
  const edges = options.edges ?? [];
  const executor = new MiddlewareExecutor(createFlowCore(nodes, edges), options.chain as MiddlewareChain);
  return executor.run({ nodes, edges, metadata: mockMetadata }, options.update, ['updateNode']);
};

const passThrough: Middleware = {
  name: 'pass-through',
  execute: (_context, next) => {
    next();
  },
};

describe('MiddlewareExecutor', () => {
  // Unreachable through FlowCore: MiddlewareManager appends internal
  // middlewares after user ones, so a user middleware is never last in the chain.
  describe('duplicate next() on a raw chain', () => {
    it('should report a duplicate next() from the last middleware and reject the duplicate call', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        let duplicate: Promise<FlowState> | undefined;
        const doubleNext: Middleware = {
          name: 'double-next',
          execute: (_context, next) => {
            next();
            duplicate = next();
          },
        };

        const state = await runExecutor({ chain: [doubleNext], update: { nodesToAdd: [mockNode] } });

        // The first next() completed the pass normally.
        expect(state?.nodes).toContainEqual(expect.objectContaining({ id: mockNode.id }));
        await expect(duplicate).rejects.toThrow('executed next() multiple times');
        expect(
          errorSpy.mock.calls.some((call) => call.some((arg) => String(arg).includes('executed next() multiple times')))
        ).toBe(true);
      } finally {
        errorSpy.mockRestore();
      }
    });

    it('should not apply the state update passed to a duplicate next() call', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      try {
        const doubleNext: Middleware = {
          name: 'double-next',
          execute: (_context, next) => {
            next({ nodesToUpdate: [{ id: 'n1', position: { x: 10, y: 10 } }] });
            // Duplicate — its update must be ignored, not half-applied.
            next({ nodesToUpdate: [{ id: 'n1', position: { x: 999, y: 999 } }] });
          },
        };
        // An async downstream middleware keeps the pass alive across the
        // duplicate call, so a wrongly applied update WOULD reach the final state.
        const delayedPass: Middleware = {
          name: 'delayed-pass',
          execute: async (_context, next) => {
            await new Promise<void>((resolve) => setTimeout(resolve, 10));
            next();
          },
        };

        const state = await runExecutor({
          chain: [doubleNext, delayedPass],
          update: {},
          nodes: [{ ...mockNode, id: 'n1' }],
        });

        expect(state?.nodes.find((node) => node.id === 'n1')?.position).toEqual({ x: 10, y: 10 });
      } finally {
        errorSpy.mockRestore();
      }
    });
  });

  // The change-tracking half of the executor — the context helpers that
  // built-in middlewares base their early-exits on.
  describe('change tracking through context helpers', () => {
    it('should expose nodes added by the initial update', async () => {
      let captured: Record<string, unknown> | undefined;
      const capture: Middleware = {
        name: 'capture',
        execute: (context, next) => {
          captured = {
            added: context.helpers.checkIfNodeAdded('n1'),
            anyAdded: context.helpers.anyNodesAdded(),
            addedIds: context.helpers.getAddedNodes().map((node) => node.id),
          };
          next();
        },
      };

      await runExecutor({ chain: [capture], update: { nodesToAdd: [{ ...mockNode, id: 'n1' }] } });

      expect(captured).toEqual({ added: true, anyAdded: true, addedIds: ['n1'] });
    });

    it('should track updated nodes together with their changed props', async () => {
      let captured: Record<string, unknown> | undefined;
      const capture: Middleware = {
        name: 'capture',
        execute: (context, next) => {
          captured = {
            changedN1: context.helpers.checkIfNodeChanged('n1'),
            changedN2: context.helpers.checkIfNodeChanged('n2'),
            affectedByPosition: context.helpers.getAffectedNodeIds(['position']),
            positionChanged: context.helpers.checkIfAnyNodePropsChanged(['position']),
            sizeChanged: context.helpers.checkIfAnyNodePropsChanged(['size']),
            changedIds: context.helpers.getChangedNodeIds(),
          };
          next();
        },
      };

      await runExecutor({
        chain: [capture],
        update: { nodesToUpdate: [{ id: 'n1', position: { x: 5, y: 5 } }] },
        nodes: [
          { ...mockNode, id: 'n1' },
          { ...mockNode, id: 'n2' },
        ],
      });

      expect(captured).toEqual({
        changedN1: true,
        changedN2: false,
        affectedByPosition: ['n1'],
        positionChanged: true,
        sizeChanged: false,
        changedIds: ['n1'],
      });
    });

    it('should not mark a node as changed when the update carries the same values', async () => {
      let captured: Record<string, unknown> | undefined;
      const capture: Middleware = {
        name: 'capture',
        execute: (context, next) => {
          captured = {
            changed: context.helpers.checkIfNodeChanged('n1'),
            changedIds: context.helpers.getChangedNodeIds(),
          };
          next();
        },
      };
      const node: Node = { ...mockNode, id: 'n1', position: { x: 3, y: 4 }, selected: false };

      const state = await runExecutor({
        chain: [capture],
        update: { nodesToUpdate: [{ id: 'n1', position: { x: 3, y: 4 }, selected: false }] },
        nodes: [node],
      });

      expect(captured).toEqual({ changed: false, changedIds: [] });
      // The untouched node keeps its identity — no needless copy was made.
      expect(state?.nodes.find((candidate) => candidate.id === 'n1')).toBe(node);
    });

    it('should expose removed nodes from the initial snapshot and drop them from the final state', async () => {
      let captured: Record<string, unknown> | undefined;
      const capture: Middleware = {
        name: 'capture',
        execute: (context, next) => {
          captured = {
            removed: context.helpers.checkIfNodeRemoved('n1'),
            anyRemoved: context.helpers.anyNodesRemoved(),
            removedIds: context.helpers.getRemovedNodes().map((node) => node.id),
          };
          next();
        },
      };

      const state = await runExecutor({
        chain: [capture],
        update: { nodesToRemove: ['n1'] },
        nodes: [{ ...mockNode, id: 'n1' }],
      });

      expect(captured).toEqual({ removed: true, anyRemoved: true, removedIds: ['n1'] });
      expect(state?.nodes).toEqual([]);
    });

    it('should make one middleware’s contribution visible to the next one, with history', async () => {
      let captured: Record<string, unknown> | undefined;
      const contributor: Middleware = {
        name: 'contributor',
        execute: (_context, next) => {
          next({ nodesToUpdate: [{ id: 'n1', selected: true }] });
        },
      };
      const observer: Middleware = {
        name: 'observer',
        execute: (context, next) => {
          captured = {
            changed: context.helpers.checkIfNodeChanged('n1'),
            affectedBySelected: context.helpers.getAffectedNodeIds(['selected']),
            selectedInMap: context.nodesMap.get('n1')?.selected,
            history: context.history.map((entry) => entry.name),
          };
          next();
        },
      };

      const state = await runExecutor({
        chain: [contributor, observer],
        update: {},
        nodes: [{ ...mockNode, id: 'n1' }],
      });

      expect(captured).toEqual({
        changed: true,
        affectedBySelected: ['n1'],
        selectedInMap: true,
        history: ['contributor'],
      });
      expect(state?.nodes.find((node) => node.id === 'n1')?.selected).toBe(true);
    });

    it('should merge a metadata-only update without copying the node and edge maps', async () => {
      let mapsShared: boolean | undefined;
      const capture: Middleware = {
        name: 'capture',
        execute: (context, next) => {
          mapsShared = context.nodesMap === context.initialNodesMap && context.edgesMap === context.initialEdgesMap;
          next();
        },
      };

      const state = await runExecutor({
        chain: [capture],
        update: { metadataUpdate: { viewport: { x: 7, y: 8, scale: 2 } } },
        nodes: [{ ...mockNode, id: 'n1' }],
      });

      expect(mapsShared).toBe(true);
      expect(state?.metadata.viewport).toEqual({ x: 7, y: 8, scale: 2 });
    });

    it('should copy the node and edge maps for updates that touch entities', async () => {
      let mapsShared: boolean | undefined;
      const capture: Middleware = {
        name: 'capture',
        execute: (context, next) => {
          mapsShared = context.nodesMap === context.initialNodesMap;
          next();
        },
      };

      await runExecutor({
        chain: [capture, passThrough],
        update: { nodesToUpdate: [{ id: 'n1', position: { x: 1, y: 1 } }] },
        nodes: [{ ...mockNode, id: 'n1' }],
      });

      expect(mapsShared).toBe(false);
    });
  });
});
