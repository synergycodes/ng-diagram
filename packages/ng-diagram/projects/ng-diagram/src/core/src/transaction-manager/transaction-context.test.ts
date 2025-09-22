import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FlowCore } from '../flow-core';
import { mockNode } from '../test-utils';
import type { TransactionContext } from '../types/transaction.interface';
import { Transaction } from './transaction';
import { createTransactionContext } from './transaction-context';

describe('createTransactionContext', () => {
  let mockTransaction: Transaction;
  let mockFlowCore: FlowCore;
  let context: TransactionContext;

  beforeEach(() => {
    mockTransaction = {
      isAborted: vi.fn(() => false),
      rollback: vi.fn(),
      addSavepoint: vi.fn(),
      abort: vi.fn(),
      hasChanges: vi.fn(() => false),
      getQueue: vi.fn(() => []),
    } as unknown as Transaction;

    mockFlowCore = {
      commandHandler: {
        emit: vi.fn(),
        emitInternal: vi.fn(),
      },
      transactionManager: {
        transaction: vi.fn(),
      },
    } as unknown as FlowCore;

    context = createTransactionContext(mockTransaction as Transaction, mockFlowCore);
  });

  describe('emit', () => {
    it('should call flowCore.commandHandler.emitInternal when transaction is not rolled back', async () => {
      await context.emit('addNodes', { nodes: [mockNode] });

      expect(mockFlowCore.commandHandler.emitInternal).toHaveBeenCalledWith('addNodes', true, { nodes: [mockNode] });
    });

    it('should throw error when transaction is rolled back', async () => {
      vi.mocked(mockTransaction.isAborted).mockReturnValue(true);

      await expect(context.emit('addNodes', { nodes: [mockNode] })).rejects.toThrow(
        'Cannot emit on rolled back transaction'
      );

      expect(mockFlowCore.commandHandler.emitInternal).not.toHaveBeenCalled();
    });

    it('should handle emit without additional parameters', async () => {
      await context.emit('addNodes', { nodes: [mockNode] });

      expect(mockFlowCore.commandHandler.emitInternal).toHaveBeenCalledWith('addNodes', true, { nodes: [mockNode] });
    });
  });

  describe('abort', () => {
    it('should call transaction.abort', () => {
      context.abort();

      expect(mockTransaction.abort).toHaveBeenCalledOnce();
    });
  });

  describe('savepoint', () => {
    it('should add savepoint when transaction is not rolled back', () => {
      context.savepoint('checkpoint1');

      expect(mockTransaction.addSavepoint).toHaveBeenCalledWith('checkpoint1');
    });

    it('should throw error when creating savepoint on rolled back transaction', () => {
      vi.mocked(mockTransaction.isAborted).mockReturnValue(true);

      expect(() => context.savepoint('checkpoint1')).toThrow('Cannot create savepoint on rolled back transaction');

      expect(mockTransaction.addSavepoint).not.toHaveBeenCalled();
    });
  });

  describe('rollbackTo', () => {
    it('should rollback to savepoint when transaction is not rolled back', () => {
      context.rollbackTo('checkpoint1');

      expect(mockTransaction.rollback).toHaveBeenCalledWith('checkpoint1');
    });

    it('should throw error when rolling back to savepoint on rolled back transaction', () => {
      vi.mocked(mockTransaction.isAborted).mockReturnValue(true);

      expect(() => context.rollbackTo('checkpoint1')).toThrow(
        'Cannot rollback to savepoint on already rolled back transaction'
      );

      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });
  });

  describe('transaction', () => {
    it('should delegate to flowCore.transactionManager.transaction', async () => {
      const mockCallback = vi.fn();
      const expectedResult = { results: {}, commandsCount: 0 };

      vi.mocked(mockFlowCore.transactionManager.transaction).mockResolvedValue(expectedResult);

      const result = await context.transaction('nestedTx', mockCallback);

      expect(mockFlowCore.transactionManager.transaction).toHaveBeenCalledWith('nestedTx', mockCallback);
      expect(result).toBe(expectedResult);
    });
  });

  describe('state inspection', () => {
    it('should return hasChanges from transaction', () => {
      vi.mocked(mockTransaction.hasChanges).mockReturnValue(true);

      expect(context.hasChanges()).toBe(true);
      expect(mockTransaction.hasChanges).toHaveBeenCalledOnce();
    });

    it('should return isDirty as true when has changes and not rolled back', () => {
      vi.mocked(mockTransaction.hasChanges).mockReturnValue(true);
      vi.mocked(mockTransaction.isAborted).mockReturnValue(false);

      expect(context.isDirty()).toBe(true);
    });

    it('should return isDirty as false when rolled back', () => {
      vi.mocked(mockTransaction.hasChanges).mockReturnValue(true);
      vi.mocked(mockTransaction.isAborted).mockReturnValue(true);

      expect(context.isDirty()).toBe(false);
    });

    it('should return isDirty as false when no changes', () => {
      vi.mocked(mockTransaction.hasChanges).mockReturnValue(false);
      vi.mocked(mockTransaction.isAborted).mockReturnValue(false);

      expect(context.isDirty()).toBe(false);
    });

    it('should return queued updates from transaction', () => {
      const mockQueue = [
        { update: { nodesToAdd: [] }, actionType: 'addNodes' },
        { update: { edgesToAdd: [] }, actionType: 'addEdges' },
      ];
      vi.mocked(mockTransaction.getQueue).mockReturnValue(mockQueue);

      expect(context.getQueuedUpdates()).toEqual(mockQueue);
      expect(mockTransaction.getQueue).toHaveBeenCalledOnce();
    });
  });
});
