import type { FlowCore } from '../flow-core';
import type { FlowStateUpdate, LooseAutocomplete, ModelActionType } from '../types';
import { createTransactionContext } from './transaction-context';
import type { TransactionContext } from './transaction.types';

export interface TransactionState<TFlowCore extends FlowCore> {
  name: LooseAutocomplete<ModelActionType>;
  queue: { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[];
  savepoints: Map<string, number>;
  isAborted: boolean;
  parent: Transaction<TFlowCore> | null;
}

export class Transaction<TFlowCore extends FlowCore = FlowCore> {
  private queue: { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[] = [];
  private savepoints = new Map<string, number>();
  private _isAborted = false;
  private children: Transaction<TFlowCore>[] = [];
  private _context: TransactionContext | null = null;

  constructor(
    private readonly name: LooseAutocomplete<ModelActionType>,
    private readonly parent: Transaction<TFlowCore> | null,
    private readonly flowCore: TFlowCore
  ) {
    if (parent) {
      parent.children.push(this);
    }
  }

  /**
   * Get the transaction context, creating it lazily if needed
   */
  get context(): TransactionContext {
    if (!this._context) {
      this._context = createTransactionContext(this, this.flowCore);
    }
    return this._context;
  }

  /**
   * Check if the transaction has been completely aborted
   */
  isAborted(): boolean {
    return this._isAborted;
  }

  /**
   * Completely abort the transaction, making it unusable.
   * This also aborts all child transactions.
   */
  abort(): void {
    if (this._isAborted) return;

    this._isAborted = true;
    this.queue = [];
    this.savepoints.clear();
    // Abort all children
    this.children.forEach((child) => child.abort());
  }

  /**
   * Create a savepoint that can be rolled back to later
   */
  addSavepoint(name: string): void {
    this.ensureNotAborted();
    this.savepoints.set(name, this.queue.length);
  }

  /**
   * Rollback to a savepoint or to the beginning of the transaction.
   * Unlike abort(), this keeps the transaction active.
   * @param savepointName - If provided, rollback to this savepoint. If not provided, rollback to the beginning.
   */
  rollback(savepointName?: string): void {
    this.ensureNotAborted();

    if (savepointName === undefined) {
      // Rollback to the beginning (clear all updates but keep transaction active)
      this.queue = [];
      this.savepoints.clear();
      // Rollback all children to beginning
      this.children.forEach((child) => child.rollback());
      return;
    }

    const index = this.savepoints.get(savepointName);
    if (index === undefined) {
      throw new Error(`Savepoint '${savepointName}' not found`);
    }

    // Remove all updates after the savepoint
    this.queue = this.queue.slice(0, index);

    // Remove any savepoints created after this one
    const savepointsToRemove: string[] = [];
    this.savepoints.forEach((savepointIndex, name) => {
      if (savepointIndex > index) {
        savepointsToRemove.push(name);
      }
    });
    savepointsToRemove.forEach((name) => this.savepoints.delete(name));

    // Rollback children that were created after this savepoint
    // (This is a simplified approach - you might want more sophisticated child transaction handling)
    this.children.forEach((child) => child.rollback());
  }

  /**
   * Commit the transaction by merging changes to parent or applying them
   */
  commit(): void {
    this.ensureNotAborted();
    if (this.parent) {
      this.mergeToParent();
    }
    // Note: If this is a root transaction, you might want to apply changes to the actual state here
  }

  /**
   * Check if the transaction can be committed (not aborted and has changes)
   */
  canCommit(): boolean {
    return !this._isAborted && this.hasChanges();
  }

  /**
   * Ensure the transaction is not aborted, throwing an error if it is
   */
  private ensureNotAborted(): void {
    if (this._isAborted) {
      throw new Error('Cannot perform operation on aborted transaction');
    }
  }

  hasChanges(): boolean {
    return this.queue.length > 0 || this.children.some((child) => child.hasChanges());
  }

  getQueue(): readonly { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[] {
    return [...this.queue] as const;
  }

  queueUpdate(update: FlowStateUpdate, actionType: LooseAutocomplete<ModelActionType>): void {
    this.ensureNotAborted();
    this.queue.push({ update, actionType });
  }

  getState(): TransactionState<TFlowCore> {
    return {
      name: this.name,
      queue: [...this.queue],
      savepoints: new Map(this.savepoints),
      isAborted: this._isAborted,
      parent: this.parent,
    };
  }

  mergeToParent(): void {
    this.ensureNotAborted();
    if (!this.parent) {
      return;
    }
    this.queue.forEach((item) => {
      this.parent!.queueUpdate(item.update, item.actionType);
    });
  }

  getMergedUpdates(): { mergedUpdate: FlowStateUpdate; commandsCount: number } {
    if (this._isAborted) {
      return { mergedUpdate: {}, commandsCount: 0 };
    }

    const commandsCount = this.queue.length;

    const nodesToAddBatches: NonNullable<FlowStateUpdate['nodesToAdd']>[] = [];
    const nodesToRemoveBatches: NonNullable<FlowStateUpdate['nodesToRemove']>[] = [];
    const nodesToUpdateBatches: NonNullable<FlowStateUpdate['nodesToUpdate']>[] = [];
    const edgesToAddBatches: NonNullable<FlowStateUpdate['edgesToAdd']>[] = [];
    const edgesToRemoveBatches: NonNullable<FlowStateUpdate['edgesToRemove']>[] = [];
    const edgesToUpdateBatches: NonNullable<FlowStateUpdate['edgesToUpdate']>[] = [];
    const metadataUpdates: NonNullable<FlowStateUpdate['metadataUpdate']>[] = [];

    for (const { update } of this.queue) {
      if (update.nodesToAdd?.length) nodesToAddBatches.push(update.nodesToAdd);
      if (update.nodesToRemove?.length) nodesToRemoveBatches.push(update.nodesToRemove);
      if (update.nodesToUpdate?.length) nodesToUpdateBatches.push(update.nodesToUpdate);
      if (update.edgesToAdd?.length) edgesToAddBatches.push(update.edgesToAdd);
      if (update.edgesToRemove?.length) edgesToRemoveBatches.push(update.edgesToRemove);
      if (update.edgesToUpdate?.length) edgesToUpdateBatches.push(update.edgesToUpdate);
      if (update.metadataUpdate) metadataUpdates.push(update.metadataUpdate);
    }

    const mergedUpdate: FlowStateUpdate = {};
    if (nodesToAddBatches.length > 0) mergedUpdate.nodesToAdd = nodesToAddBatches.flat();
    if (nodesToRemoveBatches.length > 0) mergedUpdate.nodesToRemove = nodesToRemoveBatches.flat();
    if (nodesToUpdateBatches.length > 0) mergedUpdate.nodesToUpdate = nodesToUpdateBatches.flat();
    if (edgesToAddBatches.length > 0) mergedUpdate.edgesToAdd = edgesToAddBatches.flat();
    if (edgesToRemoveBatches.length > 0) mergedUpdate.edgesToRemove = edgesToRemoveBatches.flat();
    if (edgesToUpdateBatches.length > 0) mergedUpdate.edgesToUpdate = edgesToUpdateBatches.flat();
    if (metadataUpdates.length > 0) {
      mergedUpdate.metadataUpdate = Object.assign({}, ...metadataUpdates);
    }
    return { mergedUpdate, commandsCount };
  }
}
