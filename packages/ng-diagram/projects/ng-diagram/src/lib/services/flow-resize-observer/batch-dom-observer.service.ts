import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';

export type BatchProcessor = (entries: ResizeObserverEntry[]) => void;

export type ObservedElementMetadata =
  | {
      type: 'port';
      nodeId: string;
      portId: string;
    }
  | {
      type: 'edge-label';
      edgeId: string;
      labelId: string;
    }
  | {
      type: 'node';
      nodeId: string;
    };

@Injectable()
export class BatchDomObserverService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  private observer: ResizeObserver | null = null;
  private styleObserver: MutationObserver | null = null;
  private observedElements = new WeakMap<Element, ObservedElementMetadata>();
  private batchProcessor?: BatchProcessor;
  private rafId: number | null = null;
  private pendingEntries: ResizeObserverEntry[] = [];

  constructor() {
    // Create observers outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.observer = new ResizeObserver((entries) => {
        // Collect all entries
        this.pendingEntries.push(...entries);

        // Schedule batch processing
        if (!this.rafId) {
          this.rafId = requestAnimationFrame(() => {
            /**
             * Double RAF ensures layout stability.
             *
             * This prevents:
             * - Reading stale element measurements during layout recalculation
             * - Race conditions where elements haven't reached final positions
             * - Visual glitches from processing resize data too early
             *
             * First RAF: Batch all current frame resize events
             * Second RAF: Wait for layout to fully stabilize before processing
             *
             * References:
             * Frame scheduling: https://medium.com/@paul_irish/requestanimationframe-scheduling-for-nerds-9c57f7438ef4
             * ResizeObserver: https://web.dev/articles/resize-observer#when_is_it_being_reported
             */
            requestAnimationFrame(() => {
              this.processBatch();
            });
          });
        }
      });

      // Detects CSS-driven position changes (e.g., style.top binding) that don't trigger ResizeObserver.
      this.styleObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          this.invalidate(mutation.target as Element);
        }
      });
    });
  }

  /**
   * Set the global batch processor that handles all resize events
   */
  setBatchProcessor(processor: BatchProcessor): void {
    this.batchProcessor = processor;
  }

  /**
   * Observe an element with metadata
   */
  observe(element: Element, metadata: ObservedElementMetadata): void {
    this.observedElements.set(element, metadata);
    this.observer?.observe(element);
  }

  /**
   * Stop observing an element
   */
  unobserve(element: Element): void {
    this.observer?.unobserve(element);
    // WeakMap automatically handles cleanup
  }

  /**
   * Observe an element's style attribute for changes.
   * When the style changes, the element is automatically invalidated
   * to trigger a position re-measurement via ResizeObserver.
   */
  observeStyle(element: Element): void {
    this.styleObserver?.observe(element, { attributes: true, attributeFilter: ['style'] });
  }

  /**
   * Force ResizeObserver to re-deliver an observation for the element.
   * Useful when an element's position changed without a size change,
   * since ResizeObserver only detects size changes.
   */
  invalidate(element: Element): void {
    const metadata = this.observedElements.get(element);
    if (!metadata) return;
    this.observer?.unobserve(element);
    this.observer?.observe(element);
  }

  /**
   * Get metadata for an element
   */
  getMetadata(element: Element): ObservedElementMetadata | undefined {
    return this.observedElements.get(element);
  }

  private processBatch(): void {
    const entries = [...this.pendingEntries];
    this.pendingEntries = [];
    this.rafId = null;

    if (entries.length === 0 || !this.batchProcessor) return;

    // Run batch processor in Angular zone
    this.ngZone.run(() => {
      this.batchProcessor!(entries);
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.observer?.disconnect();
    this.styleObserver?.disconnect();
  }
}
