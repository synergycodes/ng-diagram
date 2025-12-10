import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { MarkerRegistryService } from '../../services/marker-registry/marker-registry.service';

/**
 * Component for defining SVG markers with cross-browser SVG2 support.
 *
 * This component enables the use of SVG2 properties like `context-stroke` and `context-fill`
 * in marker definitions across all browsers. These properties allow markers to automatically
 * inherit the stroke/fill color from the referencing edge, enabling dynamic color changes
 * on hover, selection, and other states.
 *
 * Safari does not natively support `context-stroke`/`context-fill`, so this component
 * registers the marker element for automatic inline rendering with `currentColor` fallback.
 *
 * @example
 * ```html
 * <ng-diagram-marker>
 *   <svg>
 *     <defs>
 *       <marker
 *         id="square-arrowhead"
 *         viewBox="0 0 10 10"
 *         refX="8"
 *         refY="5"
 *         markerWidth="10"
 *         markerHeight="10"
 *       >
 *         <rect x="1" y="1" width="8" height="8" fill="context-stroke" />
 *       </marker>
 *     </defs>
 *   </svg>
 * </ng-diagram-marker>
 * ```
 *
 * @public
 * @since 0.9.0
 * @category Components
 */
@Component({
  selector: 'ng-diagram-marker',
  standalone: true,
  template: `<ng-content />`,
  styles: [
    `
      :host {
        display: contents;
      }
      :host ::ng-deep svg {
        position: absolute;
        pointer-events: none;
        fill: currentColor;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramMarkerComponent implements AfterViewInit {
  private readonly elementRef = inject(ElementRef);
  private readonly markerRegistry = inject(MarkerRegistryService);
  private readonly destroyRef = inject(DestroyRef);

  private markerId: string | null = null;

  // @internal
  ngAfterViewInit(): void {
    const markerElement = this.elementRef.nativeElement.querySelector('marker') as SVGMarkerElement | null;
    if (!markerElement) {
      console.warn('[ngDiagram] Marker element not found in projected content');
      return;
    }

    const id = markerElement.getAttribute('id');
    if (!id) {
      console.warn('[ngDiagram] Marker element must have an id attribute');
      return;
    }

    this.markerId = id;
    this.markerRegistry.registerMarker(id, markerElement);

    this.destroyRef.onDestroy(() => {
      if (this.markerId) {
        this.markerRegistry.unregisterMarker(this.markerId);
      }
    });
  }
}
