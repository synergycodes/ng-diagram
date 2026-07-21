import { CommandByName, CommandName, FlowCore, WithoutName } from '../../core/src';

/** `emit` fixed to the payload-carrying arity, so a generic command name typechecks. */
type PayloadEmit<K extends CommandName> = (commandName: K, payload: WithoutName<CommandByName<K>>) => Promise<void>;

/**
 * Emits a command, optionally wrapped in a NAMED `waitForMeasurements` transaction
 * (named after the command, so `modelActionType` keeps reporting the command name).
 * The shared implementation behind every service method that accepts
 * `options?: { waitForMeasurements?: boolean }`.
 *
 * Callers evaluate `this.flowCore` at the call site (the first argument), so an
 * uninitialized diagram throws synchronously instead of surfacing an unhandled
 * promise rejection on fire-and-forget calls.
 *
 * Inside an already active transaction the option is ignored with a warning — the
 * nested transaction would suspend past the outer commit (and an un-awaited call
 * would corrupt the transaction stack), so the outer transaction owns the timing.
 */
export const emitWithMeasurementOption = <K extends CommandName>(
  flowCore: FlowCore,
  commandName: K,
  payload: WithoutName<CommandByName<K>>,
  options?: { waitForMeasurements?: boolean }
): Promise<void> => {
  if (options?.waitForMeasurements && !flowCore.transactionManager.isActive()) {
    return flowCore
      .transaction(
        commandName,
        async (tx) => {
          await (tx.emit as PayloadEmit<K>)(commandName, payload);
        },
        // Spread the caller's options so internal tuning fields (e.g. the
        // measurement discovery-window escape hatch) reach the transaction.
        { ...options, waitForMeasurements: true }
      )
      .then(() => undefined);
  }
  if (options?.waitForMeasurements) {
    console.warn(
      '[ngDiagram] waitForMeasurements is ignored inside a transaction — pass { waitForMeasurements: true } to the transaction itself instead.'
    );
  }
  return (flowCore.commandHandler.emit as PayloadEmit<K>)(commandName, payload);
};
