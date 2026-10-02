/**
 * Monotonic generation counter — the standard O(1) cache-invalidation idiom.
 *
 * A producer calls {@link bump} whenever the tracked aspect actually changed;
 * consumers remember the {@link version} they last saw and treat a mismatch
 * as "invalidate and re-read". Unlike a dirty flag it supports any number of
 * independent consumers, and unlike caching derived values (e.g. counts) it
 * cannot alias two different states.
 *
 * @internal
 */
export class ChangeGeneration {
  private v = 0;

  bump(): void {
    this.v++;
  }

  get version(): number {
    return this.v;
  }
}
