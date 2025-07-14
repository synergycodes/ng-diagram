import type { FlowCore } from '../flow-core';
import type { FlowStateUpdate, LooseAutocomplete, ModelActionType } from '../types';
import { Transaction } from './transaction';
import type { TransactionCallback, TransactionResult } from './transaction.types';

export class TransactionManager<TFlowCore extends FlowCore = FlowCore> {
  private transactionStack: Transaction[] = [];

  constructor(private readonly flowCore: TFlowCore) {}

  async transaction(callback: TransactionCallback): Promise<TransactionResult>;
  async transaction(
    name: LooseAutocomplete<ModelActionType>,
    callback: TransactionCallback
  ): Promise<TransactionResult>;
  async transaction(
    nameOrCallback: LooseAutocomplete<ModelActionType> | TransactionCallback,
    callback?: TransactionCallback
  ): Promise<TransactionResult> {
    const [transactionName, transactionCallback] = this.parseArgs(nameOrCallback, callback);

    const parentTransaction = this.getCurrentTransaction();
    const transaction = new Transaction(transactionName, parentTransaction, this.flowCore);

    this.transactionStack.push(transaction);

    try {
      // Execute callback with transaction context
      await transactionCallback(transaction.context);

      if (!transaction.isAborted()) {
        if (parentTransaction) {
          // Nested transaction - merge to parent
          transaction.mergeToParent();
        } else {
          // Root transaction - apply changes
          const { mergedUpdate, commandsCount } = transaction.getMergedUpdates();

          return {
            results: mergedUpdate,
            commandsCount,
          };
        }
      }

      return {
        results: {},
        commandsCount: 0,
      };
    } catch (error) {
      // Automatic rollback on error
      transaction.rollback();
      throw error;
    } finally {
      // Remove from stack
      this.transactionStack.pop();
    }
  }

  queueUpdate(update: FlowStateUpdate, actionType: LooseAutocomplete<ModelActionType>): void {
    const currentTransaction = this.getCurrentTransaction();

    if (!currentTransaction) {
      throw new Error('No active transaction. Cannot queue update.');
    }
    currentTransaction.queueUpdate(update, actionType);
  }

  isActive(): boolean {
    return this.transactionStack.length > 0;
  }

  getTransactionName(): LooseAutocomplete<ModelActionType> | null {
    const current = this.getCurrentTransaction();

    return current ? current.getState().name : null;
  }

  private getCurrentTransaction(): Transaction | null {
    return this.transactionStack[this.transactionStack.length - 1] || null;
  }

  private parseArgs(
    nameOrCallback: LooseAutocomplete<ModelActionType> | TransactionCallback,
    callback?: TransactionCallback
  ): [LooseAutocomplete<ModelActionType>, TransactionCallback] {
    if (typeof nameOrCallback === 'function') {
      return ['Transaction' as ModelActionType, nameOrCallback];
    }

    if (!callback) {
      throw new Error('Callback is required when transaction name is provided');
    }

    return [nameOrCallback, callback];
  }
}
