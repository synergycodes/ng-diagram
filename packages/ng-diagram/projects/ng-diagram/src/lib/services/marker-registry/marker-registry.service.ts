import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/**
 * Check if the browser supports context-stroke for SVG markers.
 * Safari doesn't support this, so we need inline markers as fallback.
 */
function supportsContextStroke(platformId: object): boolean {
  if (!isPlatformBrowser(platformId)) {
    return true; // Assume support during SSR
  }
  // CSS.supports may not be available in test environments
  if (typeof CSS === 'undefined' || !CSS.supports) {
    return true; // Assume support in test environments
  }
  return CSS.supports('stroke', 'context-stroke');
}

/**
 * Service for registering and managing SVG markers with automatic
 * Safari compatibility handling.
 *
 * This service stores references to SVGMarkerElements and provides
 * a cloning mechanism for Safari inline markers.
 */
@Injectable()
export class MarkerRegistryService {
  private readonly platformId = inject(PLATFORM_ID);

  private readonly markers = signal<Map<string, SVGMarkerElement>>(new Map());

  readonly useInlineMarkers = !supportsContextStroke(this.platformId);

  registerMarker(id: string, element: SVGMarkerElement): void {
    this.markers.update((map) => {
      const newMap = new Map(map);
      newMap.set(id, element);
      return newMap;
    });
  }

  unregisterMarker(markerId: string): void {
    this.markers.update((map) => {
      const newMap = new Map(map);
      newMap.delete(markerId);
      return newMap;
    });
  }

  getMarkerUrl(markerId: string, edgeId: string, position: 'source' | 'target'): string {
    const id = this.useInlineMarkers ? `${markerId}-${edgeId}-${position}` : markerId;
    return `url(#${id})`;
  }

  cloneMarkerElement(markerId: string, newId: string): SVGMarkerElement | null {
    const element = this.markers().get(markerId);
    if (!element) {
      return null;
    }

    const clone = element.cloneNode(true) as SVGMarkerElement;
    clone.id = newId;

    this.replaceContextColors(clone);

    return clone;
  }

  private replaceContextColors(element: Element): void {
    const stroke = element.getAttribute('stroke');
    if (stroke === 'context-stroke') {
      element.setAttribute('stroke', 'currentColor');
    }

    const fill = element.getAttribute('fill');
    if (fill === 'context-fill' || fill === 'context-stroke') {
      element.setAttribute('fill', 'currentColor');
    }

    for (const child of Array.from(element.children)) {
      this.replaceContextColors(child);
    }
  }
}
