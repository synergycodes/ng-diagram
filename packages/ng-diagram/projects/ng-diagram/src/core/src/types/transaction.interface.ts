import type { CommandHandler, FlowStateUpdate, LooseAutocomplete, ModelActionType } from '.';

export interface TransactionContext {
  // Command emission

  /**
   * Emits a command in the core system.
   * @param name - The name of the command to emit.
   * @returns A promise that resolves when the command is emitted.
   */
  emit: CommandHandler['emit'];

  // Transaction control

  /**
   * Discards all changes in the current transaction
   */
  abort(): void;
  /**
   * Saves a point in the transaction.
   * @param name - The name of the savepoint.
   */
  savepoint(name: string): void;
  /**
   * Rolls back the transaction to a previously created savepoint
   * or to the beginning of the transaction if no savepoint is provided.
   * @param savepoint - The name of the savepoint to rollback to.
   */
  rollbackTo(savepoint?: string): void;

  // Nested transactions

  /**
   * Starts a new nested transaction.
   * @param name - The name of the transaction.
   * @param callback - The callback to execute in the transaction.
   * @returns A promise that resolves when the transaction is complete.
   */
  transaction(name: LooseAutocomplete<ModelActionType>, callback: TransactionCallback): Promise<TransactionResult>;

  // State inspection
  /**
   * Checks if the transaction has changes.
   * @returns True if the transaction has changes, false otherwise.
   */
  hasChanges(): boolean;
  /**
   * Checks if the transaction is dirty.
   * @returns True if the transaction is dirty, false otherwise.
   */
  isDirty(): boolean;
  /**
   * Gets the queued updates in the transaction.
   * @returns Readonly array of queued updates.
   */
  getQueuedUpdates(): readonly { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[];
}

export type TransactionCallback = (context: TransactionContext) => void | Promise<void>;

/**
 * Result of a transaction execution.
 *
 * @category Types/Middleware
 */
export interface TransactionResult {
  /**
   * Results of the transaction as a state update
   */
  results: FlowStateUpdate;
  /**
   * Number of commands emitted during the transaction
   */
  commandsCount: number;
}
