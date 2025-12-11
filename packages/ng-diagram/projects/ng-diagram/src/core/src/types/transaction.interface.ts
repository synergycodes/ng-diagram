import type { CommandHandler, FlowStateUpdate, LooseAutocomplete, ModelActionType, ModelActionTypes } from '.';

/**
 * Options for configuring transaction behavior.
 *
 * @public
 * @since 0.10.0
 * @category Types/Transaction
 */
export interface TransactionOptions {
  /**
   * When true, the transaction promise will not resolve until all measurements
   * (node sizes, port positions, etc.) triggered by the transaction are complete.
   *
   * This is useful when you need to perform operations that depend on measured values,
   * such as `zoomToFit()` after adding nodes.
   *
   * The measurement tracking uses a debounce-based approach: when DOM measurements
   * change (e.g., ResizeObserver fires), the debounce timer resets. Only when the
   * debounce expires without new changes is the measurement considered complete.
   *
   * @default false
   *
   * @example
   * ```typescript
   * // Without waitForMeasurements - zoomToFit might not include new nodes
   * await flowCore.transaction(async (tx) => {
   *   await tx.emit('addNodes', { nodes: [newNode] });
   * });
   * await viewportService.zoomToFit(); // May not account for new node dimensions
   *
   * // With waitForMeasurements - zoomToFit will include new nodes
   * await flowCore.transaction(async (tx) => {
   *   await tx.emit('addNodes', { nodes: [newNode] });
   * }, { waitForMeasurements: true });
   * await viewportService.zoomToFit(); // Correctly includes new node dimensions
   * ```
   */
  waitForMeasurements?: boolean;
}

/**
 * Internal options for measurement tracking. These are escape hatches for edge cases.
 * Not part of the public API - use by casting to `any`.
 *
 * @internal
 */
export interface InternalTransactionOptions extends TransactionOptions {
  /** Debounce timeout in ms after last measurement activity before completing. @default 50 */
  _measurementDebounceTimeout?: number;
  /** Initial timeout in ms to wait for first measurement activity. @default 1000 */
  _measurementInitialTimeout?: number;
}

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
  getQueuedUpdates(): readonly { update: FlowStateUpdate; actionTypes: ModelActionTypes }[];
}

export type TransactionCallback = (context: TransactionContext) => void | Promise<void>;

/**
 * Result of a transaction execution.
 *
 * @public
 * @since 0.8.0
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
  /**
   * All action types that were executed within the transaction.
   * @since 0.9.0
   */
  actionTypes: ModelActionTypes;
}
