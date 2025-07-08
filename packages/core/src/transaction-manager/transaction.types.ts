import type { CommandHandler, FlowStateUpdate, LooseAutocomplete, ModelActionType } from '../types';

export interface TransactionContext {
  // Command emission
  emit: CommandHandler['emit'];

  // Transaction control
  rollback(): void;
  savepoint(name: string): void;
  rollbackTo(savepoint: string): void;

  // Nested transactions
  transaction(name: LooseAutocomplete<ModelActionType>, callback: TransactionCallback): Promise<TransactionResult>;

  // State inspection
  hasChanges(): boolean;
  isDirty(): boolean;
  getQueuedUpdates(): readonly { update: FlowStateUpdate; actionType: LooseAutocomplete<ModelActionType> }[];
}

export type TransactionCallback = (context: TransactionContext) => Promise<void>;

export interface TransactionResult {
  results: FlowStateUpdate;
  commandsCount: number;
}
