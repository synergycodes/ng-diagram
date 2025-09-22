import type { FlowCore } from '../flow-core';
import { ModelActionType } from '../types';
import type { TransactionCallback, TransactionContext, TransactionResult } from '../types/transaction.interface';
import type { Transaction } from './transaction';

/**
 * Factory function to create a TransactionContext
 * This approach provides better type safety and avoids 'this' binding issues
 */
export function createTransactionContext<TFlowCore extends FlowCore>(
  transaction: Transaction<TFlowCore>,
  flowCore: TFlowCore
): TransactionContext {
  const context: TransactionContext = {
    emit: async (command, ...data) => {
      if (transaction.isAborted()) {
        throw new Error('Cannot emit on rolled back transaction');
      }

      // Call the internal emit method with bypassTransaction=true to avoid recursion
      await flowCore.commandHandler.emitInternal(command, true, ...data);
    },

    abort: () => {
      transaction.abort();
    },

    savepoint: (name: string) => {
      if (transaction.isAborted()) {
        throw new Error('Cannot create savepoint on rolled back transaction');
      }
      transaction.addSavepoint(name);
    },

    rollbackTo: (savepointName) => {
      if (transaction.isAborted()) {
        throw new Error('Cannot rollback to savepoint on already rolled back transaction');
      }
      transaction.rollback(savepointName);
    },

    transaction: (name: ModelActionType, callback: TransactionCallback): Promise<TransactionResult> => {
      // Delegate to TransactionManager for nested transaction
      return flowCore.transactionManager.transaction(name, callback);
    },

    hasChanges: (): boolean => {
      return transaction.hasChanges();
    },

    isDirty: (): boolean => {
      return !transaction.isAborted() && transaction.hasChanges();
    },

    getQueuedUpdates: () => {
      return transaction.getQueue();
    },
  };

  return context;
}
