import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../flow-core';
import { mockEdge, mockNode } from '../test-utils';
import type { FlowStateUpdate } from '../types';
import { Transaction } from './transaction';

describe('Transaction', () => {
  let mockFlowCore: FlowCore;
  let transaction: Transaction;

  beforeEach(() => {
    mockFlowCore = {
      commandHandler: {
        emit: vi.fn(),
      },
      transactionManager: {
        transaction: vi.fn(),
      },
    } as unknown as FlowCore;

    transaction = new Transaction('testTransaction', null, mockFlowCore);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(transaction.isRolledBack()).toBe(false);
      expect(transaction.hasChanges()).toBe(false);
      expect(transaction.getQueue()).toEqual([]);
    });

    it('should add itself to parent when parent is provided', () => {
      const parentTransaction = new Transaction('parent', null, mockFlowCore as FlowCore);

      const childTransaction = new Transaction('child', parentTransaction, mockFlowCore as FlowCore);

      // Access private children array through hasChanges behavior
      expect(parentTransaction.hasChanges()).toBe(false);

      // Queue something in child to verify parent-child relationship
      childTransaction.queueUpdate({ nodesToAdd: [] }, 'test');
      expect(parentTransaction.hasChanges()).toBe(true); // Parent sees child changes
    });
  });

  describe('context getter', () => {
    it('should create context lazily', () => {
      const context1 = transaction.context;
      const context2 = transaction.context;

      expect(context1).toBe(context2); // Same instance
      expect(context1).toBeDefined();
      expect(typeof context1.emit).toBe('function');
    });
  });

  describe('rollback', () => {
    it('should set rolled back state and clear queue', () => {
      transaction.queueUpdate({ nodesToAdd: [] }, 'test');
      expect(transaction.hasChanges()).toBe(true);

      transaction.rollback();

      expect(transaction.isRolledBack()).toBe(true);
      expect(transaction.hasChanges()).toBe(false);
      expect(transaction.getQueue()).toEqual([]);
    });

    it('should rollback all children', () => {
      const child1 = new Transaction('child1', transaction, mockFlowCore as FlowCore);
      const child2 = new Transaction('child2', transaction, mockFlowCore as FlowCore);

      child1.queueUpdate({ nodesToAdd: [] }, 'test');
      child2.queueUpdate({ edgesToAdd: [] }, 'test');

      transaction.rollback();

      expect(child1.isRolledBack()).toBe(true);
      expect(child2.isRolledBack()).toBe(true);
    });
  });

  describe('savepoints', () => {
    it('should add savepoint at current queue position', () => {
      transaction.queueUpdate({ nodesToAdd: [] }, 'add1');
      transaction.addSavepoint('checkpoint1');
      transaction.queueUpdate({ nodesToAdd: [] }, 'add2');
      transaction.addSavepoint('checkpoint2');

      expect(transaction.getQueue()).toHaveLength(2);
    });

    it('should rollback to savepoint correctly', () => {
      transaction.queueUpdate({ nodesToAdd: [] }, 'add1');
      transaction.addSavepoint('checkpoint1');
      transaction.queueUpdate({ edgesToAdd: [] }, 'add2');
      transaction.queueUpdate({ nodesToUpdate: [] }, 'add3');

      transaction.rollbackToSavepoint('checkpoint1');

      expect(transaction.getQueue()).toHaveLength(1);
      expect(transaction.getQueue()[0].actionType).toBe('add1');
    });

    it('should throw error when savepoint not found', () => {
      expect(() => transaction.rollbackToSavepoint('nonexistent')).toThrow("Savepoint 'nonexistent' not found");
    });

    it('should remove savepoints created after rollback point', () => {
      transaction.queueUpdate({ nodesToAdd: [] }, 'add1');
      transaction.addSavepoint('checkpoint1');
      transaction.queueUpdate({ edgesToAdd: [] }, 'add2');
      transaction.addSavepoint('checkpoint2');
      transaction.queueUpdate({ nodesToUpdate: [] }, 'add3');
      transaction.addSavepoint('checkpoint3');

      transaction.rollbackToSavepoint('checkpoint1');

      // checkpoint2 and checkpoint3 should be removed
      expect(() => transaction.rollbackToSavepoint('checkpoint2')).toThrow();
      expect(() => transaction.rollbackToSavepoint('checkpoint3')).toThrow();
    });
  });

  describe('queueUpdate', () => {
    it('should queue updates when not rolled back', () => {
      const update1: FlowStateUpdate = { nodesToAdd: [] };
      const update2: FlowStateUpdate = { edgesToAdd: [] };

      transaction.queueUpdate(update1, 'action1');
      transaction.queueUpdate(update2, 'action2');

      const queue = transaction.getQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0]).toEqual({ update: update1, actionType: 'action1' });
      expect(queue[1]).toEqual({ update: update2, actionType: 'action2' });
    });

    it('should throw error when queuing on rolled back transaction', () => {
      transaction.rollback();

      expect(() => transaction.queueUpdate({ nodesToAdd: [] }, 'test')).toThrow(
        'Cannot queue update on rolled back transaction'
      );
    });
  });

  describe('hasChanges', () => {
    it('should return false when no updates queued', () => {
      expect(transaction.hasChanges()).toBe(false);
    });

    it('should return true when updates are queued', () => {
      transaction.queueUpdate({ nodesToAdd: [] }, 'test');
      expect(transaction.hasChanges()).toBe(true);
    });

    it('should return true when child has changes', () => {
      const child = new Transaction('child', transaction, mockFlowCore as FlowCore);

      expect(transaction.hasChanges()).toBe(false);

      child.queueUpdate({ nodesToAdd: [] }, 'test');

      expect(transaction.hasChanges()).toBe(true);
    });
  });

  describe('mergeToParent', () => {
    it('should merge queue to parent when not rolled back', () => {
      const parent = new Transaction('parent', null, mockFlowCore as FlowCore);
      const child = new Transaction('child', parent, mockFlowCore as FlowCore);

      child.queueUpdate({ nodesToAdd: [] }, 'childAction');
      child.mergeToParent();

      expect(parent.getQueue()).toHaveLength(1);
      expect(parent.getQueue()[0].actionType).toBe('childAction');
    });

    it('should not merge when rolled back', () => {
      const parent = new Transaction('parent', null, mockFlowCore as FlowCore);
      const child = new Transaction('child', parent, mockFlowCore as FlowCore);

      child.queueUpdate({ nodesToAdd: [] }, 'childAction');
      child.rollback();
      child.mergeToParent();

      expect(parent.getQueue()).toHaveLength(0);
    });

    it('should not merge when no parent', () => {
      transaction.queueUpdate({ nodesToAdd: [] }, 'action');

      // Should not throw
      expect(() => transaction.mergeToParent()).not.toThrow();
    });
  });

  describe('getMergedUpdates', () => {
    it('should return empty update when rolled back', () => {
      transaction.queueUpdate({ nodesToAdd: [mockNode] }, 'addNodes');
      transaction.rollback();

      const result = transaction.getMergedUpdates();

      expect(result.mergedUpdate).toEqual({});
      expect(result.commandsCount).toBe(0);
    });

    it('should merge all queued updates correctly', () => {
      transaction.queueUpdate({ nodesToAdd: [mockNode], edgesToAdd: [mockEdge] }, 'addNodes');
      transaction.queueUpdate({ nodesToAdd: [{ ...mockNode, id: '2' }], nodesToRemove: ['3'] }, 'addNodes');
      transaction.queueUpdate({ metadataUpdate: { viewport: { x: 100, y: 200, scale: 1 } } }, 'updateViewport');

      const result = transaction.getMergedUpdates();

      expect(result.mergedUpdate).toEqual({
        nodesToAdd: [mockNode, { ...mockNode, id: '2' }],
        nodesToRemove: ['3'],
        edgesToAdd: [mockEdge],
        metadataUpdate: { viewport: { x: 100, y: 200, scale: 1 } },
      });
      expect(result.commandsCount).toBe(3);
    });

    it('should merge metadata updates with last-write-wins', () => {
      transaction.queueUpdate(
        { metadataUpdate: { viewport: { x: 100, y: 200, scale: 1 }, selection: { nodes: ['1'] } } },
        'update1'
      );
      transaction.queueUpdate({ metadataUpdate: { viewport: { x: 200, y: 200, scale: 1 }, theme: 'dark' } }, 'update2');

      const result = transaction.getMergedUpdates();

      expect(result.mergedUpdate.metadataUpdate).toEqual({
        viewport: { x: 200, y: 200, scale: 1 },
        selection: { nodes: ['1'] },
        theme: 'dark',
      });
    });
  });

  describe('getState', () => {
    it('should return complete transaction state', () => {
      transaction.queueUpdate({ nodesToAdd: [] }, 'action1');
      transaction.addSavepoint('checkpoint1');

      const state = transaction.getState();

      expect(state.name).toBe('testTransaction');
      expect(state.queue).toHaveLength(1);
      expect(state.savepoints.get('checkpoint1')).toBe(1);
      expect(state.isRolledBack).toBe(false);
      expect(state.parent).toBeNull();
    });
  });
});
