import type { FlowState } from '../types';

/**
 * Settlement callbacks of one pending `next()` promise — draining them when
 * the pass settles resumes every upstream middleware suspended on `await next()`.
 */
export interface PassResolver {
  resolve: (state: FlowState) => void;
  reject: (error: unknown) => void;
}

/** How a pass ended. `state` is what suspended `await next()` callers receive. */
export type PassOutcome =
  | { kind: 'completed'; state: FlowState }
  | { kind: 'cancelled'; state: FlowState }
  | { kind: 'failed'; error: unknown };

/**
 * Owns the single settlement of one middleware pass: the outcome, the suspended
 * `await next()` callers, and the pass promise's callbacks.
 */
export class PassSettlement {
  private outcome: PassOutcome | null = null;
  private readonly suspended: PassResolver[] = [];

  constructor(
    private readonly resolvePass: (state: FlowState | undefined) => void,
    private readonly rejectPass: (error: unknown) => void
  ) {}

  isSettled(): boolean {
    return this.outcome !== null;
  }

  /** Registers a pending next() promise, resumed when the pass settles. */
  suspend(resolver: PassResolver): void {
    this.suspended.push(resolver);
  }

  /**
   * Settles the pass exactly once — resumes every suspended caller and settles
   * the pass promise. A late 'failed' outcome is reported as a stray error;
   * other late outcomes are no-ops.
   */
  settle(outcome: PassOutcome): void {
    if (this.outcome !== null) {
      if (outcome.kind === 'failed') {
        this.reportStrayError(outcome.error);
      }
      return;
    }
    this.outcome = outcome;
    switch (outcome.kind) {
      case 'completed':
        this.resolvePass(outcome.state);
        this.drain((resolver) => resolver.resolve(outcome.state));
        break;
      case 'cancelled':
        this.drain((resolver) => resolver.resolve(outcome.state));
        this.resolvePass(undefined);
        break;
      case 'failed':
        this.drain((resolver) => resolver.reject(outcome.error));
        this.rejectPass(outcome.error);
        break;
    }
  }

  /** The result a late next() call returns after the pass has settled. */
  lateNextResult(): Promise<FlowState> {
    const outcome = this.outcome;
    if (outcome === null) {
      throw new Error('lateNextResult() requires a settled pass');
    }
    return outcome.kind === 'failed' ? Promise.reject(outcome.error) : Promise.resolve(outcome.state);
  }

  /**
   * Reports any error the pass rejection does not already carry — only cascade
   * rethrows of the already-reported pass error stay silent.
   */
  reportStrayError(error: unknown): void {
    if (this.outcome?.kind === 'failed' && error === this.outcome.error) {
      return;
    }
    console.error('[ngDiagram]', error);
  }

  private drain(resume: (resolver: PassResolver) => void): void {
    while (this.suspended.length > 0) {
      resume(this.suspended.pop()!);
    }
  }
}
