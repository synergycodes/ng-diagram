import type { FlowCore } from '../flow-core';
import type { FlowStateUpdate, LooseAutocomplete, ModelActionType, ModelActionTypes } from '../types';
import type { TransactionCallback, TransactionOptions, TransactionResult } from '../types/transaction.interface';
import { Transaction } from './transaction';

export class TransactionManager<TFlowCore extends FlowCore = FlowCore> {
  private transactionStack: Transaction[] = [];
  private pendingOptions: TransactionOptions | null = null;

  constructor(private readonly flowCore: TFlowCore) {}

  async transaction(callback: TransactionCallback): Promise<TransactionResult>;
  async transaction(callback: TransactionCallback, options: TransactionOptions): Promise<TransactionResult>;
  async transaction(
    name: LooseAutocomplete<ModelActionType>,
    callback: TransactionCallback
  ): Promise<TransactionResult>;
  async transaction(
    name: LooseAutocomplete<ModelActionType>,
    callback: TransactionCallback,
    options: TransactionOptions
  ): Promise<TransactionResult>;
  async transaction(
    nameOrCallback: LooseAutocomplete<ModelActionType> | TransactionCallback,
    callbackOrOptions?: TransactionCallback | TransactionOptions,
    options?: TransactionOptions
  ): Promise<TransactionResult> {
    const [transactionName, transactionCallback, transactionOptions] = this.parseArgs(
      nameOrCallback,
      callbackOrOptions,
      options
    );

    const parentTransaction = this.getCurrentTransaction();
    const transaction = new Transaction(transactionName, parentTransaction, this.flowCore);

    // Only root transactions can have options - nested transactions inherit from parent
    if (!parentTransaction && transactionOptions) {
      this.pendingOptions = transactionOptions;
    }

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
          const { mergedUpdate, commandsCount, actionTypes } = transaction.getMergedUpdates();

          return {
            results: mergedUpdate,
            commandsCount,
            actionTypes,
          };
        }
      }

      return {
        results: {},
        commandsCount: 0,
        actionTypes: [],
      };
    } catch (error) {
      // Automatic rollback on error
      transaction.rollback();
      throw error;
    } finally {
      // Remove from stack
      this.transactionStack.pop();
      // Clear options when root transaction ends
      if (!parentTransaction) {
        this.pendingOptions = null;
      }
    }
  }

  /**
   * Gets the options for the current root transaction.
   * Returns null if no transaction is active or no options were provided.
   */
  getCurrentOptions(): TransactionOptions | null {
    return this.pendingOptions;
  }

  queueUpdate(update: FlowStateUpdate, actionTypes: ModelActionTypes): void {
    const currentTransaction = this.getCurrentTransaction();

    if (!currentTransaction) {
      throw new Error('No active transaction. Cannot queue update.');
    }
    currentTransaction.queueUpdate(update, actionTypes);
  }

  isActive(): boolean {
    return this.transactionStack.length > 0;
  }

  getTransactionName(): LooseAutocomplete<ModelActionType> | null {
    const current = this.getCurrentTransaction();

    return current ? current.getState().name : null;
  }

  getCurrentTransaction(): Transaction | null {
    return this.transactionStack[this.transactionStack.length - 1] || null;
  }

  private parseArgs(
    nameOrCallback: LooseAutocomplete<ModelActionType> | TransactionCallback,
    callbackOrOptions?: TransactionCallback | TransactionOptions,
    options?: TransactionOptions
  ): [LooseAutocomplete<ModelActionType>, TransactionCallback, TransactionOptions | undefined] {
    // Case 1: transaction(callback)
    // Case 2: transaction(callback, options)
    if (typeof nameOrCallback === 'function') {
      const transactionOptions = callbackOrOptions as TransactionOptions | undefined;
      return ['Transaction' as ModelActionType, nameOrCallback, transactionOptions];
    }

    // Case 3: transaction(name, callback)
    // Case 4: transaction(name, callback, options)
    if (typeof callbackOrOptions !== 'function') {
      throw new Error('Callback is required when transaction name is provided');
    }

    return [nameOrCallback, callbackOrOptions, options];
  }
}
