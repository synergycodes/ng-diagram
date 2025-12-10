import { DestroyRef, Directive, effect, ElementRef, inject, input } from '@angular/core';
import { MarkerRegistryService } from '../../services/marker-registry/marker-registry.service';

/**
 * Directive for rendering inline SVG markers in Safari.
 *
 * Safari doesn't support `context-stroke` for SVG markers, so this directive
 * clones marker elements and appends them to the host `<defs>` element with
 * `currentColor` substitution.
 *
 * @internal
 * @since 0.9.0
 */
@Directive({
  selector: '[ngDiagramInlineMarkers]',
  standalone: true,
})
export class InlineMarkersDirective {
  private readonly el = inject(ElementRef<SVGDefsElement>);
  private readonly markerRegistry = inject(MarkerRegistryService);
  private readonly destroyRef = inject(DestroyRef);

  sourceMarkerId = input<string | undefined>();

  targetMarkerId = input<string | undefined>();

  edgeId = input.required<string>();

  private sourceMarkerRef: SVGMarkerElement | null = null;
  private targetMarkerRef: SVGMarkerElement | null = null;

  constructor() {
    // Use effect to react to signal input changes
    effect(() => {
      this.cleanup();
      this.appendMarkers();
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  private appendMarkers(): void {
    const sourceId = this.sourceMarkerId();
    if (sourceId) {
      const newId = `${sourceId}-${this.edgeId()}-source`;
      this.sourceMarkerRef = this.markerRegistry.cloneMarkerElement(sourceId, newId);
      if (this.sourceMarkerRef) {
        this.el.nativeElement.appendChild(this.sourceMarkerRef);
      }
    }

    const targetId = this.targetMarkerId();
    if (targetId) {
      const newId = `${targetId}-${this.edgeId()}-target`;
      this.targetMarkerRef = this.markerRegistry.cloneMarkerElement(targetId, newId);
      if (this.targetMarkerRef) {
        this.el.nativeElement.appendChild(this.targetMarkerRef);
      }
    }
  }

  private cleanup(): void {
    this.sourceMarkerRef?.remove();
    this.targetMarkerRef?.remove();
    this.sourceMarkerRef = null;
    this.targetMarkerRef = null;
  }
}
