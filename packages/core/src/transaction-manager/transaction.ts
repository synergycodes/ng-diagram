import type { FlowCore } from '../flow-core';
import type { FlowStateUpdate, LooseAutocomplete, ModelActionType } from '../types';
import { createTransactionContext } from './transaction-context';
import type { TransactionContext } from './transaction.types';

export interface TransactionState<TFlowCore extends FlowCore> {
  name: LooseAutocomplete<ModelActionType>;
  queue: { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[];
  savepoints: Map<string, number>;
  isRolledBack: boolean;
  parent: Transaction<TFlowCore> | null;
}

export class Transaction<TFlowCore extends FlowCore = FlowCore> {
  private queue: { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[] = [];
  private savepoints = new Map<string, number>();
  private _isRolledBack = false;
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

  isRolledBack(): boolean {
    return this._isRolledBack;
  }

  rollback(): void {
    this._isRolledBack = true;
    this.queue = [];
    // Rollback all children
    this.children.forEach((child) => child.rollback());
  }

  addSavepoint(name: string): void {
    this.savepoints.set(name, this.queue.length);
  }

  rollbackToSavepoint(savepointName: string): void {
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
  }

  hasChanges(): boolean {
    return this.queue.length > 0 || this.children.some((child) => child.hasChanges());
  }

  getQueue(): readonly { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[] {
    return [...this.queue] as const;
  }

  queueUpdate(update: FlowStateUpdate, actionType: LooseAutocomplete<ModelActionType>): void {
    if (this._isRolledBack) {
      throw new Error('Cannot queue update on rolled back transaction');
    }
    this.queue.push({ update, actionType });
  }

  getState(): TransactionState<TFlowCore> {
    return {
      name: this.name,
      queue: [...this.queue],
      savepoints: new Map(this.savepoints),
      isRolledBack: this._isRolledBack,
      parent: this.parent,
    };
  }

  mergeToParent(): void {
    if (!this.parent || this._isRolledBack) {
      return;
    }
    this.queue.forEach((item) => {
      this.parent!.queueUpdate(item.update, item.actionType);
    });
  }

  getMergedUpdates(): { mergedUpdate: FlowStateUpdate; commandsCount: number } {
    if (this._isRolledBack) {
      return { mergedUpdate: {}, commandsCount: 0 };
    }

    const mergedUpdate: FlowStateUpdate = {};
    const commandsCount = this.queue.length;

    // Merge all queued updates
    for (const { update } of this.queue) {
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
    }

    return { mergedUpdate, commandsCount };
  }
}
