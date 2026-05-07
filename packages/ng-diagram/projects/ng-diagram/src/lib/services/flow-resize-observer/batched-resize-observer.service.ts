import { inject, Injectable, NgZone, OnDestroy } from '@angular/core';

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

export interface BatchResizeObserverConfig {
  /** Processes batched resize entries after the double-RAF stabilization. */
  processBatch: (entries: ResizeObserverEntry[]) => void;
  /** Fires when ResizeObserver detects entries, before batch processing is scheduled. */
  onObserverActivity?: (metadata: ObservedElementMetadata[]) => void;
}

@Injectable()
export class BatchResizeObserverService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  private observer: ResizeObserver | null = null;
  private observedElements = new WeakMap<Element, ObservedElementMetadata>();
  private entityIndex = new Map<string, Set<Element>>();
  private config: BatchResizeObserverConfig | null = null;
  private rafId: number | null = null;
  private pendingEntries: ResizeObserverEntry[] = [];

  constructor() {
    // Create observer outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.observer = new ResizeObserver((entries) => {
        // Collect all entries
        this.pendingEntries.push(...entries);

        // Notify about observer activity before RAF scheduling.
        if (this.config?.onObserverActivity) {
          const metadataList: ObservedElementMetadata[] = [];
          for (const entry of entries) {
            const metadata = this.observedElements.get(entry.target);
            if (metadata) {
              metadataList.push(metadata);
            }
          }
          if (metadataList.length > 0) {
            this.config.onObserverActivity(metadataList);
          }
        }

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
    });
  }

  /**
   * Configure batch processing and optional observer activity callbacks.
   */
  configure(config: BatchResizeObserverConfig): void {
    this.config = config;
  }

  /**
   * Observe an element's size with metadata via ResizeObserver.
   */
  observe(element: Element, metadata: ObservedElementMetadata): void {
    this.observedElements.set(element, metadata);
    this.addToEntityIndex(element, metadata);
    this.observer?.observe(element);
  }

  /**
   * Stop observing an element's size via ResizeObserver.
   */
  unobserve(element: Element): void {
    const metadata = this.observedElements.get(element);
    if (metadata) {
      this.removeFromEntityIndex(element, metadata);
      this.observedElements.delete(element);
    }
    this.observer?.unobserve(element);
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

  /**
   * Invalidate the node element and all its port elements.
   * @internal
   */
  invalidateNode(nodeId: string): void {
    this.invalidateByKey(`node:${nodeId}`);
  }

  /**
   * Invalidate all label elements on an edge.
   * @internal
   */
  invalidateEdgeLabels(edgeId: string): void {
    this.invalidateByKey(`edge:${edgeId}`);
  }

  /**
   * Invalidate ALL currently observed elements.
   * @internal
   */
  invalidateAll(): void {
    const seen = new Set<Element>();
    for (const elements of this.entityIndex.values()) {
      for (const element of elements) {
        if (!seen.has(element)) {
          seen.add(element);
          this.invalidate(element);
        }
      }
    }
  }

  private invalidateByKey(key: string): void {
    const elements = this.entityIndex.get(key);
    if (!elements) return;
    for (const element of elements) {
      this.invalidate(element);
    }
  }

  private getEntityKeys(metadata: ObservedElementMetadata): string[] {
    switch (metadata.type) {
      case 'node':
      case 'port':
        return [`node:${metadata.nodeId}`];
      case 'edge-label':
        return [`edge:${metadata.edgeId}`];
    }
  }

  private addToEntityIndex(element: Element, metadata: ObservedElementMetadata): void {
    for (const key of this.getEntityKeys(metadata)) {
      let set = this.entityIndex.get(key);
      if (!set) {
        set = new Set();
        this.entityIndex.set(key, set);
      }
      set.add(element);
    }
  }

  private removeFromEntityIndex(element: Element, metadata: ObservedElementMetadata): void {
    for (const key of this.getEntityKeys(metadata)) {
      const set = this.entityIndex.get(key);
      if (set) {
        set.delete(element);
        if (set.size === 0) {
          this.entityIndex.delete(key);
        }
      }
    }
  }

  private processBatch(): void {
    const entries = [...this.pendingEntries];
    this.pendingEntries = [];
    this.rafId = null;

    if (entries.length === 0 || !this.config) return;

    // Run batch processor in Angular zone
    this.ngZone.run(() => {
      this.config!.processBatch(entries);
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.observer?.disconnect();
    this.entityIndex.clear();
  }
}
