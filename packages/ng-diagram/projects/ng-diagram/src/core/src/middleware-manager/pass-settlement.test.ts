import { describe, expect, it, vi } from 'vitest';
import type { FlowState } from '../types';
import { PassSettlement } from './pass-settlement';

const makeState = (): FlowState => ({
  nodes: [],
  edges: [],
  metadata: { viewport: { x: 0, y: 0, scale: 1 } },
});

const makeSettlement = () => {
  const resolvePass = vi.fn<(state: FlowState | undefined) => void>();
  const rejectPass = vi.fn<(error: unknown) => void>();
  return { settlement: new PassSettlement(resolvePass, rejectPass), resolvePass, rejectPass };
};

const makeResolver = () => ({
  resolve: vi.fn<(state: FlowState) => void>(),
  reject: vi.fn<(error: unknown) => void>(),
});

describe('PassSettlement', () => {
  it('should resolve the pass and resume suspended callers with the final state on completed', () => {
    const { settlement, resolvePass, rejectPass } = makeSettlement();
    const resolver = makeResolver();
    settlement.suspend(resolver);
    const finalState = makeState();

    settlement.settle({ kind: 'completed', state: finalState });

    expect(settlement.isSettled()).toBe(true);
    expect(resolvePass).toHaveBeenCalledExactlyOnceWith(finalState);
    expect(resolver.resolve).toHaveBeenCalledExactlyOnceWith(finalState);
    expect(rejectPass).not.toHaveBeenCalled();
    expect(resolver.reject).not.toHaveBeenCalled();
  });

  it('should resolve the pass with undefined and resume suspended callers with the provided state on cancelled', () => {
    const { settlement, resolvePass, rejectPass } = makeSettlement();
    const resolver = makeResolver();
    settlement.suspend(resolver);
    const initialState = makeState();

    settlement.settle({ kind: 'cancelled', state: initialState });

    expect(resolvePass).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(resolver.resolve).toHaveBeenCalledExactlyOnceWith(initialState);
    expect(rejectPass).not.toHaveBeenCalled();
  });

  it('should reject the pass and suspended callers with the error on failed', () => {
    const { settlement, resolvePass, rejectPass } = makeSettlement();
    const resolver = makeResolver();
    settlement.suspend(resolver);
    const error = new Error('boom');

    settlement.settle({ kind: 'failed', error });

    expect(rejectPass).toHaveBeenCalledExactlyOnceWith(error);
    expect(resolver.reject).toHaveBeenCalledExactlyOnceWith(error);
    expect(resolvePass).not.toHaveBeenCalled();
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it('should settle exactly once — later non-failed outcomes are no-ops', () => {
    const { settlement, resolvePass, rejectPass } = makeSettlement();
    settlement.settle({ kind: 'completed', state: makeState() });

    settlement.settle({ kind: 'cancelled', state: makeState() });
    settlement.settle({ kind: 'completed', state: makeState() });

    expect(resolvePass).toHaveBeenCalledTimes(1);
    expect(rejectPass).not.toHaveBeenCalled();
  });

  it('should report a late failed outcome instead of settling again', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { settlement, rejectPass } = makeSettlement();
      settlement.settle({ kind: 'cancelled', state: makeState() });
      const lateError = new Error('late');

      settlement.settle({ kind: 'failed', error: lateError });

      expect(rejectPass).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledExactlyOnceWith('[ngDiagram]', lateError);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('should stay silent for a rethrow of the pass error but report a distinct error', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { settlement } = makeSettlement();
      const passError = new Error('pass failed');
      settlement.settle({ kind: 'failed', error: passError });

      settlement.reportStrayError(passError);
      settlement.settle({ kind: 'failed', error: passError });
      expect(errorSpy).not.toHaveBeenCalled();

      const distinct = new Error('cleanup exploded');
      settlement.reportStrayError(distinct);
      expect(errorSpy).toHaveBeenCalledExactlyOnceWith('[ngDiagram]', distinct);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('should report any error while the pass is still pending', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { settlement } = makeSettlement();
      const error = new Error('early');

      settlement.reportStrayError(error);

      expect(errorSpy).toHaveBeenCalledExactlyOnceWith('[ngDiagram]', error);
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('should resume suspended callers most-recent-first', () => {
    const { settlement } = makeSettlement();
    const order: string[] = [];
    settlement.suspend({ resolve: () => order.push('first'), reject: () => order.push('first') });
    settlement.suspend({ resolve: () => order.push('second'), reject: () => order.push('second') });

    settlement.settle({ kind: 'completed', state: makeState() });

    expect(order).toEqual(['second', 'first']);
  });

  it('should settle the pass promise before resuming callers on completed, and after on cancelled and failed', () => {
    const record = (order: string[]) => ({
      settlement: new PassSettlement(
        () => order.push('pass'),
        () => order.push('pass')
      ),
      resolver: { resolve: () => order.push('caller'), reject: () => order.push('caller') },
    });

    const completed: string[] = [];
    const completedRun = record(completed);
    completedRun.settlement.suspend(completedRun.resolver);
    completedRun.settlement.settle({ kind: 'completed', state: makeState() });
    expect(completed).toEqual(['pass', 'caller']);

    const cancelled: string[] = [];
    const cancelledRun = record(cancelled);
    cancelledRun.settlement.suspend(cancelledRun.resolver);
    cancelledRun.settlement.settle({ kind: 'cancelled', state: makeState() });
    expect(cancelled).toEqual(['caller', 'pass']);

    const failed: string[] = [];
    const failedRun = record(failed);
    failedRun.settlement.suspend(failedRun.resolver);
    failedRun.settlement.settle({ kind: 'failed', error: new Error('boom') });
    expect(failed).toEqual(['caller', 'pass']);
  });

  it('should return the pass outcome from lateNextResult after settling', async () => {
    const failedRun = makeSettlement();
    const error = new Error('boom');
    failedRun.settlement.settle({ kind: 'failed', error });
    await expect(failedRun.settlement.lateNextResult()).rejects.toBe(error);

    const completedRun = makeSettlement();
    const finalState = makeState();
    completedRun.settlement.settle({ kind: 'completed', state: finalState });
    await expect(completedRun.settlement.lateNextResult()).resolves.toBe(finalState);

    const cancelledRun = makeSettlement();
    const initialState = makeState();
    cancelledRun.settlement.settle({ kind: 'cancelled', state: initialState });
    await expect(cancelledRun.settlement.lateNextResult()).resolves.toBe(initialState);
  });

  it('should throw when lateNextResult is called before the pass settled', () => {
    const { settlement } = makeSettlement();

    expect(settlement.isSettled()).toBe(false);
    expect(() => settlement.lateNextResult()).toThrow('requires a settled pass');
  });
});
