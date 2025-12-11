import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';
import type { FlowCore } from '../flow-core';
import { mockEdge, mockNode } from '../test-utils';
import type { ModelActionType } from '../types';
import { TransactionCallback } from '../types/transaction.interface';
import { TransactionManager } from './transaction-manager';

describe('TransactionManager', () => {
  let mockFlowCore: FlowCore;
  let transactionManager: TransactionManager;
  let mockEmit: Mock;
  let mockApplyUpdate: Mock;

  beforeEach(() => {
    mockEmit = vi.fn();
    mockApplyUpdate = vi.fn();
    mockFlowCore = {
      commandHandler: {
        emit: mockEmit,
        emitInternal: vi.fn(),
      },
      applyUpdate: mockApplyUpdate,
      setState: vi.fn(),
    } as unknown as FlowCore;

    transactionManager = new TransactionManager(mockFlowCore);

    // Set transactionManager reference for nested transactions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockFlowCore as any).transactionManager = transactionManager;

    mockApplyUpdate.mockImplementation(async (update, actionTypes) => {
      const actionTypesArray = Array.isArray(actionTypes) ? actionTypes : [actionTypes];
      transactionManager.queueUpdate(update, actionTypesArray);
    });

    // Setup emitInternal to simulate actual command emission behavior
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mockFlowCore.commandHandler as any).emitInternal.mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (command: string, _: boolean, ...args: any[]) => {
        // When called with bypassTransaction=true from transaction context,
        // it should queue the update through applyUpdate
        const data = args[0] || {};

        // Transform the data based on the command type for proper queueing
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let update: any = {};
        if (command === 'addNodes' && data.nodes) {
          update.nodesToAdd = data.nodes;
        } else if (command === 'addEdges' && data.edges) {
          update.edgesToAdd = data.edges;
        } else {
          update = data;
        }

        mockFlowCore.applyUpdate(update, command);
      }
    );

    mockEmit.mockImplementation(async (...args) => {
      mockFlowCore.applyUpdate(args[1], args[0]);
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('transaction with callback only', () => {
    it('should execute transaction with default name', async () => {
      const callback: TransactionCallback = async (tx) => {
        await tx.emit('addNodes', { nodes: [mockNode] });
      };

      const result = await transactionManager.transaction(callback);

      expect(mockFlowCore.commandHandler.emitInternal).toHaveBeenCalledWith('addNodes', true, {
        nodes: [mockNode],
      });
      expect(result).toEqual({
        results: expect.any(Object),
        commandsCount: 1,
        actionTypes: expect.any(Array),
      });
    });

    it('should apply updates after successful transaction', async () => {
      await transactionManager.transaction(async (tx) => {
        await tx.emit('addNodes', { nodes: [mockNode] });
        await tx.emit('addEdges', { edges: [mockEdge] });
      });

      await expect(mockFlowCore.commandHandler.emitInternal).toHaveBeenCalledTimes(2);
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ nodesToAdd: [mockNode] }),
        'addNodes'
      );
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ edgesToAdd: [mockEdge] }),
        'addEdges'
      );
    });
  });

  describe('transaction with name and callback', () => {
    it('should execute transaction with provided name', async () => {
      mockEmit.mockImplementation(async (command, { nodes, edges }) => {
        mockFlowCore.applyUpdate({ nodesToAdd: nodes, edgesToAdd: edges }, command);
      });

      const callback: TransactionCallback = vi.fn().mockImplementation(async (tx) => {
        await tx.emit('addNodes', { nodes: [mockNode] });
      });

      const result = await transactionManager.transaction('customAction', callback);

      expect(callback).toHaveBeenCalledOnce();
      expect(result).toEqual({
        results: expect.objectContaining({ nodesToAdd: [mockNode] }),
        commandsCount: 1,
        actionTypes: expect.any(Array),
      });
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ nodesToAdd: [mockNode] }),
        'addNodes'
      );
    });

    it('should throw error when callback is not provided with name', async () => {
      await expect(transactionManager.transaction('customAction', undefined as never)).rejects.toThrow(
        'Callback is required when transaction name is provided'
      );
    });
  });

  describe('error handling', () => {
    it('should rollback transaction on error', async () => {
      await expect(
        transactionManager.transaction(async (tx) => {
          await tx.emit('addNodes', { nodes: [mockNode] });

          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });

    it('should maintain correct stack after error', async () => {
      expect(transactionManager.isActive()).toBe(false);

      await expect(
        transactionManager.transaction(async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow();

      expect(transactionManager.isActive()).toBe(false);
    });
  });

  describe('nested transactions', () => {
    it('should handle nested transactions correctly', async () => {
      await transactionManager.transaction('parent' as ModelActionType, async (parentTx) => {
        await parentTx.emit('addNodes', { nodes: [mockNode] });

        await parentTx.transaction('child' as ModelActionType, async (childTx) => {
          await childTx.emit('addEdges', { edges: [mockEdge] });
        });

        await parentTx.emit('addNodes', { nodes: [{ ...mockNode, id: 'node2' }] });
      });

      expect(mockFlowCore.applyUpdate).toHaveBeenCalledTimes(3);
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ nodesToAdd: [mockNode] }),
        'addNodes'
      );
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ edgesToAdd: [mockEdge] }),
        'addEdges'
      );
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ nodesToAdd: [{ ...mockNode, id: 'node2' }] }),
        'addNodes'
      );
    });

    it('should rollback child without affecting parent', async () => {
      await transactionManager.transaction('parent', async (parentTx) => {
        await parentTx.emit('addNodes', { nodes: [mockNode] });

        try {
          await parentTx.transaction('child', async (childTx) => {
            await childTx.emit('addEdges', { edges: [mockEdge] });

            childTx.abort();
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Child transaction might not throw, depends on implementation
        }

        await parentTx.emit('addNodes', { nodes: [{ ...mockNode, id: 'node2' }] });
      });

      // Parent should still complete
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledTimes(3);
    });

    it('should handle deeply nested transactions', async () => {
      let level3Executed = false;

      await transactionManager.transaction('level1', async (tx1) => {
        await tx1.transaction('level2', async (tx2) => {
          await tx2.transaction('level3', async (tx3) => {
            await tx3.emit('addNodes', { nodes: [mockNode] });
            level3Executed = true;
          });
        });
      });

      expect(level3Executed).toBe(true);
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledOnce();
    });
  });

  describe('queueUpdate', () => {
    it('should queue update when transaction is active', async () => {
      await transactionManager.transaction(async () => {
        transactionManager.queueUpdate({ nodesToAdd: [] }, ['testAction' as ModelActionType]);
        expect(transactionManager.isActive()).toBe(true);
      });
    });

    it('should throw error when no transaction is active', () => {
      expect(() => transactionManager.queueUpdate({ nodesToAdd: [] }, ['testAction' as ModelActionType])).toThrow(
        'No active transaction. Cannot queue update.'
      );
    });
  });

  describe('isActive', () => {
    it('should return false when no transaction is active', () => {
      expect(transactionManager.isActive()).toBe(false);
    });

    it('should return true during transaction execution', async () => {
      await transactionManager.transaction(async () => {
        expect(transactionManager.isActive()).toBe(true);
      });
    });

    it('should return false after transaction completes', async () => {
      await transactionManager.transaction(async () => {
        // Transaction active here
      });
      expect(transactionManager.isActive()).toBe(false);
    });
  });

  describe('getTransactionName', () => {
    it('should return null when no transaction is active', () => {
      expect(transactionManager.getTransactionName()).toBeNull();
    });

    it('should return transaction name during execution', async () => {
      await transactionManager.transaction('testTx' as ModelActionType, async () => {
        expect(transactionManager.getTransactionName()).toBe('testTx');
      });
    });

    it('should return default name when using callback-only form', async () => {
      await transactionManager.transaction(async () => {
        expect(transactionManager.getTransactionName()).toBe('transaction');
      });
    });
  });

  describe('transaction rollback', () => {
    it('should support manual rollback', async () => {
      await transactionManager.transaction(async (tx) => {
        await tx.emit('addNodes', { nodes: [mockNode] });
        tx.abort();

        await expect(tx.emit('addEdges', { edges: [mockEdge] })).rejects.toThrow(
          'Cannot emit on rolled back transaction'
        );
      });
    });

    it('should handle savepoints correctly', async () => {
      mockEmit.mockImplementation(async (command, { nodes, edges }) => {
        mockFlowCore.applyUpdate({ nodesToAdd: nodes, edgesToAdd: edges }, command);
      });

      const result = await transactionManager.transaction(async (tx) => {
        await tx.emit('addNodes', { nodes: [mockNode] });
        tx.savepoint('checkpoint');
        await tx.emit('addNodes', { nodes: [{ ...mockNode, id: 'node2' }] });
        await tx.emit('addNodes', { nodes: [{ ...mockNode, id: 'node3' }] });
        tx.rollbackTo('checkpoint');
        await tx.emit('addEdges', { edges: [mockEdge] });
      });

      expect(mockFlowCore.commandHandler.emitInternal).toHaveBeenCalledTimes(4); // All emits still happen
      expect(mockFlowCore.applyUpdate).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        results: expect.objectContaining({ nodesToAdd: [mockNode], edgesToAdd: [mockEdge] }),
        commandsCount: 2,
        actionTypes: expect.any(Array),
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty transaction', async () => {
      await transactionManager.transaction(async () => {
        // No operations
      });

      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });

    it('should handle transaction that only checks state', async () => {
      let hasChanges = null;
      let isDirty = null;

      await transactionManager.transaction(async (tx) => {
        hasChanges = tx.hasChanges();
        isDirty = tx.isDirty();
      });

      expect(hasChanges).toBe(false);
      expect(isDirty).toBe(false);
      expect(mockFlowCore.applyUpdate).not.toHaveBeenCalled();
    });
  });
});
