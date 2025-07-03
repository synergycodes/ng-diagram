import type { FlowStateUpdate, ModelActionType } from '../types';

/**
 * Manages transaction state for FlowCore, allowing grouping of state updates and atomic execution.
 */
export class TransactionManager {
  private active = false;
  private queue: { update: FlowStateUpdate; actionType: ModelActionType }[] = [];
  private transactionName: ModelActionType | null = null;

  /**
   * Starts a new transaction. Throws if a transaction is already active.
   * @param transactionName The name of the transaction
   */
  startTransaction(transactionName: ModelActionType) {
    if (this.active) {
      throw new Error('A transaction is already active. Only one transaction can be active at a time.');
    }
    this.active = true;
    this.queue = [];
    this.transactionName = transactionName;
  }

  /**
   * Queues a state update during an active transaction.
   * @param update The state update to queue
   * @param actionType The action type for the update
   */
  queueUpdate(update: FlowStateUpdate, actionType: ModelActionType) {
    if (!this.active) {
      throw new Error('No active transaction. Cannot queue update.');
    }
    this.queue.push({ update, actionType });
  }

  /**
   * Stops the transaction and returns all queued updates. Throws if no transaction is active.
   * @returns The queued updates
   */
  stopTransaction() {
    if (!this.active) {
      throw new Error('No active transaction to stop.');
    }
    this.active = false;
    const queued = this.queue;
    this.queue = [];
    this.transactionName = null;

    return this.mergeQueuedUpdates(queued);
  }

  /**
   * Returns whether a transaction is currently active.
   */
  isActive() {
    return this.active;
  }

  /**
   * Returns the name of the current transaction, or null if none is active.
   */
  getTransactionName(): ModelActionType | null {
    return this.transactionName;
  }

  /**
   * Merges all queued updates into a single FlowStateUpdate and returns it with the last action type.
   * This does not clear the queue or affect transaction state.
   */
  private mergeQueuedUpdates(queue: { update: FlowStateUpdate; actionType: ModelActionType }[]): {
    mergedUpdate: FlowStateUpdate;
    lastActionType?: ModelActionType;
    commandsCount: number;
  } {
    const mergedUpdate: FlowStateUpdate = {};
    let lastActionType: ModelActionType | undefined;

    if (queue.length === 0) {
      return { mergedUpdate, lastActionType, commandsCount: 0 };
    }

    for (const { update, actionType } of queue) {
      if (update.nodesToAdd) {
        mergedUpdate.nodesToAdd = [...(mergedUpdate.nodesToAdd || []), ...update.nodesToAdd];
      }
      if (update.nodesToRemove) {
        mergedUpdate.nodesToRemove = [...(mergedUpdate.nodesToRemove || []), ...update.nodesToRemove];
      }
      if (update.nodesToUpdate) {
        mergedUpdate.nodesToUpdate = [...(mergedUpdate.nodesToUpdate || []), ...update.nodesToUpdate];
      }
      if (update.edgesToAdd) {
        mergedUpdate.edgesToAdd = [...(mergedUpdate.edgesToAdd || []), ...update.edgesToAdd];
      }
      if (update.edgesToRemove) {
        mergedUpdate.edgesToRemove = [...(mergedUpdate.edgesToRemove || []), ...update.edgesToRemove];
      }
      if (update.edgesToUpdate) {
        mergedUpdate.edgesToUpdate = [...(mergedUpdate.edgesToUpdate || []), ...update.edgesToUpdate];
      }
      if (update.metadataUpdate) {
        mergedUpdate.metadataUpdate = {
          ...(mergedUpdate.metadataUpdate || {}),
          ...update.metadataUpdate,
        };
      }
      lastActionType = actionType;
    }

    return { mergedUpdate, lastActionType, commandsCount: queue.length };
  }
}
