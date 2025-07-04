import { beforeEach, describe, expect, it } from 'vitest';
import { mockEdge, mockNode } from '../test-utils';
import type { FlowStateUpdate, ModelActionType } from '../types';
import { TransactionManager } from './transaction-manager';

const mockUpdate = (id: number): FlowStateUpdate => ({
  nodesToAdd: [{ ...mockNode, id: `n${id}` }],
  edgesToAdd: [{ ...mockEdge, id: `e${id}` }],
  metadataUpdate: { test: id },
});

describe('TransactionManager', () => {
  let tm: TransactionManager;
  const actionA: ModelActionType = 'addNodes';
  const actionB: ModelActionType = 'addEdges';
  const actionC: ModelActionType = 'updateNodes';

  beforeEach(() => {
    tm = new TransactionManager();
  });

  describe('Basic Transaction Lifecycle', () => {
    it('should start and stop a transaction', () => {
      tm.startTransaction('addNodes');
      expect(tm.isActive()).toBe(true);
      expect(tm.getTransactionName()).toBe('addNodes');
      tm.stopTransaction();
      expect(tm.isActive()).toBe(false);
      expect(tm.getTransactionName()).toBeNull();
    });

    it('should throw if starting a transaction twice', () => {
      tm.startTransaction('addNodes');
      expect(() => tm.startTransaction('addEdges')).toThrow('A transaction is already active');
    });

    it('should throw if stopping a transaction when none is active', () => {
      expect(() => tm.stopTransaction()).toThrow('No active transaction to stop');
    });

    it('should throw if queuing an update when no transaction is active', () => {
      expect(() => tm.queueUpdate({}, 'addNodes')).toThrow('No active transaction');
    });

    it('should return correct transaction name', () => {
      expect(tm.getTransactionName()).toBeNull();
      tm.startTransaction('changeSelection');
      expect(tm.getTransactionName()).toBe('changeSelection');
      tm.stopTransaction();
      expect(tm.getTransactionName()).toBeNull();
    });

    it('should reset state after stop and allow new transaction', () => {
      tm.startTransaction('addNodes');
      tm.queueUpdate(mockUpdate(1), actionA);
      tm.stopTransaction();

      expect(tm.isActive()).toBe(false);
      expect(tm.getTransactionName()).toBeNull();

      // Should be able to start again
      tm.startTransaction('addEdges');
      expect(tm.isActive()).toBe(true);
      expect(tm.getTransactionName()).toBe('addEdges');
      tm.stopTransaction();
    });
  });

  describe('Empty Transaction Handling', () => {
    it('should return empty merged update if no updates were queued', () => {
      tm.startTransaction('addNodes');
      const result = tm.stopTransaction();

      expect(result.commandsCount).toBe(0);
      expect(result.mergedUpdate).toEqual({});
      expect(result.lastActionType).toBeUndefined();
    });

    it('should handle empty update objects', () => {
      tm.startTransaction('init');
      tm.queueUpdate({}, actionA);
      tm.queueUpdate({}, actionB);

      const result = tm.stopTransaction();

      expect(result.commandsCount).toBe(2);
      expect(result.mergedUpdate).toEqual({});
      expect(result.lastActionType).toBe(actionB);
    });
  });

  describe('Node Operations Merging', () => {
    it('should merge nodesToAdd arrays in order', () => {
      tm.startTransaction('addNodes');
      tm.queueUpdate(
        {
          nodesToAdd: [
            { ...mockNode, id: 'n1' },
            { ...mockNode, id: 'n2' },
          ],
        },
        actionA
      );
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'n3' }] }, actionA);
      tm.queueUpdate(
        {
          nodesToAdd: [
            { ...mockNode, id: 'n4' },
            { ...mockNode, id: 'n5' },
          ],
        },
        actionA
      );

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.nodesToAdd).toHaveLength(5);
      expect(result.mergedUpdate.nodesToAdd![0].id).toBe('n1');
      expect(result.mergedUpdate.nodesToAdd![1].id).toBe('n2');
      expect(result.mergedUpdate.nodesToAdd![2].id).toBe('n3');
      expect(result.mergedUpdate.nodesToAdd![3].id).toBe('n4');
      expect(result.mergedUpdate.nodesToAdd![4].id).toBe('n5');
    });

    it('should merge nodesToRemove arrays in order', () => {
      tm.startTransaction('deleteNodes');
      tm.queueUpdate({ nodesToRemove: ['n1', 'n2'] }, actionA);
      tm.queueUpdate({ nodesToRemove: ['n3'] }, actionA);
      tm.queueUpdate({ nodesToRemove: ['n4', 'n5'] }, actionA);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.nodesToRemove).toEqual(['n1', 'n2', 'n3', 'n4', 'n5']);
    });

    it('should merge nodesToUpdate arrays in order', () => {
      tm.startTransaction('updateNodes');
      tm.queueUpdate(
        {
          nodesToUpdate: [
            { id: 'n1', position: { x: 10, y: 10 } },
            { id: 'n2', selected: true },
          ],
        },
        actionC
      );
      tm.queueUpdate(
        {
          nodesToUpdate: [{ id: 'n3', data: { label: 'test' } }],
        },
        actionC
      );

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.nodesToUpdate).toHaveLength(3);
      expect(result.mergedUpdate.nodesToUpdate![0]).toEqual({ id: 'n1', position: { x: 10, y: 10 } });
      expect(result.mergedUpdate.nodesToUpdate![1]).toEqual({ id: 'n2', selected: true });
      expect(result.mergedUpdate.nodesToUpdate![2]).toEqual({ id: 'n3', data: { label: 'test' } });
    });

    it('should preserve duplicate node IDs in arrays (no deduplication)', () => {
      tm.startTransaction('paste');
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'duplicate' }] }, actionA);
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'duplicate' }] }, actionA);
      tm.queueUpdate({ nodesToRemove: ['duplicate'] }, actionA);
      tm.queueUpdate({ nodesToRemove: ['duplicate'] }, actionA);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.nodesToAdd).toHaveLength(2);
      expect(result.mergedUpdate.nodesToRemove).toEqual(['duplicate', 'duplicate']);
    });
  });

  describe('Edge Operations Merging', () => {
    it('should merge edgesToAdd arrays in order', () => {
      tm.startTransaction('addEdges');
      tm.queueUpdate({ edgesToAdd: [{ ...mockEdge, id: 'e1' }] }, actionB);
      tm.queueUpdate(
        {
          edgesToAdd: [
            { ...mockEdge, id: 'e2' },
            { ...mockEdge, id: 'e3' },
          ],
        },
        actionB
      );

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.edgesToAdd).toHaveLength(3);
      expect(result.mergedUpdate.edgesToAdd![0].id).toBe('e1');
      expect(result.mergedUpdate.edgesToAdd![1].id).toBe('e2');
      expect(result.mergedUpdate.edgesToAdd![2].id).toBe('e3');
    });

    it('should merge edgesToRemove arrays in order', () => {
      tm.startTransaction('deleteEdges');
      tm.queueUpdate({ edgesToRemove: ['e1'] }, actionB);
      tm.queueUpdate({ edgesToRemove: ['e2', 'e3'] }, actionB);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.edgesToRemove).toEqual(['e1', 'e2', 'e3']);
    });

    it('should merge edgesToUpdate arrays in order', () => {
      tm.startTransaction('updateEdge');
      tm.queueUpdate(
        {
          edgesToUpdate: [
            { id: 'e1', selected: true },
            { id: 'e2', data: { label: 'connection' } },
          ],
        },
        actionB
      );
      tm.queueUpdate(
        {
          edgesToUpdate: [{ id: 'e3', sourcePosition: { x: 0, y: 0 } }],
        },
        actionB
      );

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.edgesToUpdate).toHaveLength(3);
      expect(result.mergedUpdate.edgesToUpdate![0]).toEqual({ id: 'e1', selected: true });
      expect(result.mergedUpdate.edgesToUpdate![1]).toEqual({ id: 'e2', data: { label: 'connection' } });
      expect(result.mergedUpdate.edgesToUpdate![2]).toEqual({ id: 'e3', sourcePosition: { x: 0, y: 0 } });
    });
  });

  describe('Mixed Operations', () => {
    it('should handle all operation types in single transaction', () => {
      tm.startTransaction('deleteElements');
      tm.queueUpdate(
        {
          nodesToAdd: [{ ...mockNode, id: 'n1' }],
          edgesToAdd: [{ ...mockEdge, id: 'e1' }],
        },
        actionA
      );
      tm.queueUpdate(
        {
          nodesToRemove: ['n2'],
          edgesToRemove: ['e2'],
        },
        actionB
      );
      tm.queueUpdate(
        {
          nodesToUpdate: [{ id: 'n3', selected: true }],
          edgesToUpdate: [{ id: 'e3', selected: true }],
        },
        actionC
      );

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.nodesToAdd).toHaveLength(1);
      expect(result.mergedUpdate.nodesToRemove).toEqual(['n2']);
      expect(result.mergedUpdate.nodesToUpdate).toHaveLength(1);
      expect(result.mergedUpdate.edgesToAdd).toHaveLength(1);
      expect(result.mergedUpdate.edgesToRemove).toEqual(['e2']);
      expect(result.mergedUpdate.edgesToUpdate).toHaveLength(1);
    });

    it('should preserve operation order across different types', () => {
      tm.startTransaction('paste');
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'first' }] }, actionA);
      tm.queueUpdate({ edgesToAdd: [{ ...mockEdge, id: 'second' }] }, actionB);
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'third' }] }, actionA);

      const result = tm.stopTransaction();

      // Nodes should maintain their relative order
      expect(result.mergedUpdate.nodesToAdd![0].id).toBe('first');
      expect(result.mergedUpdate.nodesToAdd![1].id).toBe('third');
      expect(result.mergedUpdate.edgesToAdd![0].id).toBe('second');
    });
  });

  describe('Metadata Merging', () => {
    it('should merge metadata objects with later values overwriting earlier ones', () => {
      tm.startTransaction('moveViewport');
      tm.queueUpdate({ metadataUpdate: { prop1: 'value1', prop2: 'value2' } }, actionA);
      tm.queueUpdate({ metadataUpdate: { prop2: 'newValue2', prop3: 'value3' } }, actionB);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.metadataUpdate).toEqual({
        prop1: 'value1',
        prop2: 'newValue2', // Overwritten
        prop3: 'value3',
      });
    });

    it('should handle metadata-only updates', () => {
      tm.startTransaction('highlightGroup');
      tm.queueUpdate({ metadataUpdate: { setting1: true } }, actionA);
      tm.queueUpdate({ metadataUpdate: { setting2: false } }, actionB);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate).toEqual({
        metadataUpdate: {
          setting1: true,
          setting2: false,
        },
      });
    });

    it('should handle undefined metadata gracefully', () => {
      tm.startTransaction('changeZOrder');
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'n1' }] }, actionA);
      tm.queueUpdate({ metadataUpdate: { prop: 'value' } }, actionB);
      tm.queueUpdate({ edgesToAdd: [{ ...mockEdge, id: 'e1' }] }, actionC);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.metadataUpdate).toEqual({ prop: 'value' });
      expect(result.mergedUpdate.nodesToAdd).toHaveLength(1);
      expect(result.mergedUpdate.edgesToAdd).toHaveLength(1);
    });
  });

  describe('Action Type Tracking', () => {
    it('should return last action type', () => {
      tm.startTransaction('moveNodesBy');
      tm.queueUpdate(mockUpdate(1), actionA);
      tm.queueUpdate(mockUpdate(2), actionB);
      tm.queueUpdate(mockUpdate(3), actionC);

      const result = tm.stopTransaction();

      expect(result.lastActionType).toBe(actionC);
    });

    it('should handle single action type', () => {
      tm.startTransaction('resizeNode');
      tm.queueUpdate(mockUpdate(1), actionA);

      const result = tm.stopTransaction();

      expect(result.lastActionType).toBe(actionA);
    });
  });

  describe('Command Counting', () => {
    it('should count all queued commands', () => {
      tm.startTransaction('startLinking');
      tm.queueUpdate(mockUpdate(1), actionA);
      tm.queueUpdate(mockUpdate(2), actionB);
      tm.queueUpdate({}, actionC); // Empty update still counts
      tm.queueUpdate(mockUpdate(3), actionA);

      const result = tm.stopTransaction();

      expect(result.commandsCount).toBe(4);
    });

    it('should return zero count for empty transaction', () => {
      tm.startTransaction('finishLinking');
      const result = tm.stopTransaction();

      expect(result.commandsCount).toBe(0);
    });
  });

  describe('Large Transaction Handling', () => {
    it('should handle large number of operations efficiently', () => {
      tm.startTransaction('treeLayout');

      // Queue 100 operations
      for (let i = 0; i < 100; i++) {
        tm.queueUpdate(
          {
            nodesToAdd: [{ ...mockNode, id: `n${i}` }],
            edgesToAdd: [{ ...mockEdge, id: `e${i}` }],
            metadataUpdate: { index: i },
          },
          i % 2 === 0 ? actionA : actionB
        );
      }

      const result = tm.stopTransaction();

      expect(result.commandsCount).toBe(100);
      expect(result.mergedUpdate.nodesToAdd).toHaveLength(100);
      expect(result.mergedUpdate.edgesToAdd).toHaveLength(100);
      expect(result.mergedUpdate.metadataUpdate!.index).toBe(99); // Last value wins
      expect(result.lastActionType).toBe(actionB); // 99 % 2 === 1
    });

    it('should maintain performance with mixed operation types', () => {
      tm.startTransaction('moveNodes');

      for (let i = 0; i < 50; i++) {
        tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: `add_${i}` }] }, actionA);
        tm.queueUpdate({ nodesToRemove: [`remove_${i}`] }, actionB);
        tm.queueUpdate({ nodesToUpdate: [{ id: `update_${i}`, selected: true }] }, actionC);
      }

      const result = tm.stopTransaction();

      expect(result.commandsCount).toBe(150);
      expect(result.mergedUpdate.nodesToAdd).toHaveLength(50);
      expect(result.mergedUpdate.nodesToRemove).toHaveLength(50);
      expect(result.mergedUpdate.nodesToUpdate).toHaveLength(50);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle realistic user interaction sequence', () => {
      tm.startTransaction('moveNodesStop');

      // User adds a node
      tm.queueUpdate(
        {
          nodesToAdd: [{ ...mockNode, id: 'userNode1', position: { x: 100, y: 100 } }],
        },
        'addNodes'
      );

      // User moves the node
      tm.queueUpdate(
        {
          nodesToUpdate: [{ id: 'userNode1', position: { x: 150, y: 120 } }],
        },
        'updateNodes'
      );

      // User selects the node
      tm.queueUpdate(
        {
          nodesToUpdate: [{ id: 'userNode1', selected: true }],
        },
        'changeSelection'
      );

      // User adds an edge
      tm.queueUpdate(
        {
          edgesToAdd: [{ ...mockEdge, id: 'userEdge1', source: 'userNode1', target: 'existingNode' }],
        },
        'addEdges'
      );

      // User updates viewport
      tm.queueUpdate(
        {
          metadataUpdate: { viewport: { x: 50, y: 50, scale: 1.2 } },
        },
        'moveViewport'
      );

      const result = tm.stopTransaction();

      expect(result.commandsCount).toBe(5);
      expect(result.mergedUpdate.nodesToAdd).toHaveLength(1);
      expect(result.mergedUpdate.nodesToUpdate).toHaveLength(2); // Move and select as separate operations
      expect(result.mergedUpdate.edgesToAdd).toHaveLength(1);
      expect(result.mergedUpdate.metadataUpdate).toEqual({
        viewport: { x: 50, y: 50, scale: 1.2 },
      });
    });

    it('should handle conflicting operations without resolution', () => {
      tm.startTransaction('rotateNodeBy');

      // Add same node multiple times (should keep all)
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'conflict', data: { version: 1 } }] }, actionA);
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'conflict', data: { version: 2 } }] }, actionA);

      // Update same node multiple times (should keep all)
      tm.queueUpdate({ nodesToUpdate: [{ id: 'conflict', position: { x: 10, y: 10 } }] }, actionB);
      tm.queueUpdate({ nodesToUpdate: [{ id: 'conflict', position: { x: 20, y: 20 } }] }, actionB);

      // Remove same node multiple times (should keep all)
      tm.queueUpdate({ nodesToRemove: ['conflict'] }, actionC);
      tm.queueUpdate({ nodesToRemove: ['conflict'] }, actionC);

      const result = tm.stopTransaction();

      // Original implementation keeps all operations - no conflict resolution
      expect(result.mergedUpdate.nodesToAdd).toHaveLength(2);
      expect(result.mergedUpdate.nodesToUpdate).toHaveLength(2);
      expect(result.mergedUpdate.nodesToRemove).toEqual(['conflict', 'conflict']);
    });
  });

  describe('Integration Scenarios', () => {
    it('should work correctly with mockUpdate helper', () => {
      tm.startTransaction('highlightGroupClear');
      tm.queueUpdate(mockUpdate(1), actionA);
      tm.queueUpdate(mockUpdate(2), actionB);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.nodesToAdd).toHaveLength(2);
      expect(result.mergedUpdate.edgesToAdd).toHaveLength(2);
      expect(result.mergedUpdate.metadataUpdate).toMatchObject({ test: 2 });
      expect(result.lastActionType).toBe(actionB);
    });

    it('should handle partial updates correctly', () => {
      tm.startTransaction('moveTemporaryEdge');

      // Updates with only some fields
      tm.queueUpdate({ nodesToAdd: [{ ...mockNode, id: 'partial1' }] }, actionA);
      tm.queueUpdate({ edgesToRemove: ['edge1'] }, actionB);
      tm.queueUpdate({ metadataUpdate: { setting: true } }, actionC);
      tm.queueUpdate({ nodesToUpdate: [{ id: 'node1', selected: true }] }, actionA);

      const result = tm.stopTransaction();

      expect(result.mergedUpdate.nodesToAdd).toHaveLength(1);
      expect(result.mergedUpdate.edgesToRemove).toEqual(['edge1']);
      expect(result.mergedUpdate.nodesToUpdate).toHaveLength(1);
      expect(result.mergedUpdate.metadataUpdate).toEqual({ setting: true });
      // Fields not present in any update should be undefined
      expect(result.mergedUpdate.edgesToAdd).toBeUndefined();
      expect(result.mergedUpdate.nodesToRemove).toBeUndefined();
      expect(result.mergedUpdate.edgesToUpdate).toBeUndefined();
    });
  });
});
