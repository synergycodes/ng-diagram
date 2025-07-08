import type { FlowCore } from '../flow-core';
import { ModelActionType } from '../types';
import type { Transaction } from './transaction';
import type { TransactionCallback, TransactionContext, TransactionResult } from './transaction.types';

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
      if (transaction.isRolledBack()) {
        throw new Error('Cannot emit on rolled back transaction');
      }

      // The actual emission happens through FlowCore's existing mechanism
      await flowCore.commandHandler.emit(command, ...data);
    },

    rollback: () => {
      transaction.rollback();
    },

    savepoint: (name: string) => {
      if (transaction.isRolledBack()) {
        throw new Error('Cannot create savepoint on rolled back transaction');
      }
      transaction.addSavepoint(name);
    },

    rollbackTo: (savepointName) => {
      if (transaction.isRolledBack()) {
        throw new Error('Cannot rollback to savepoint on already rolled back transaction');
      }
      transaction.rollbackToSavepoint(savepointName);
    },

    transaction: (name: ModelActionType, callback: TransactionCallback): Promise<TransactionResult> => {
      // Delegate to TransactionManager for nested transaction
      return flowCore.transactionManager.transaction(name, callback);
    },

    hasChanges: (): boolean => {
      return transaction.hasChanges();
    },

    isDirty: (): boolean => {
      return !transaction.isRolledBack() && transaction.hasChanges();
    },

    getQueuedUpdates: () => {
      return transaction.getQueue();
    },
  };

  return context;
}
