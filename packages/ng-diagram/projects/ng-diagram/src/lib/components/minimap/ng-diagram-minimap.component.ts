import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { Node } from '../../../core/src';
import { NgDiagramModelService } from '../../public-services/ng-diagram-model.service';
import { MinimapProviderService } from '../../services/minimap-provider/minimap-provider.service';
import { RendererService } from '../../services/renderer/renderer.service';
import { NgDiagramPanelPosition } from '../../types/panel-position';
import { NgDiagramMinimapNavigationDirective } from './ng-diagram-minimap-navigation.directive';
import {
  calculateMinimapTransform,
  combineDiagramAndViewportBounds,
  convertViewportToDiagramBounds,
  transformNodeToMinimapSpace,
  transformViewportToMinimapSpace,
} from './ng-diagram-minimap.calculations';

/**
 * A minimap component that displays a bird's-eye view of the diagram.
 *
 * Shows all nodes as small rectangles and a viewport rectangle indicating
 * the currently visible area. The minimap updates reactively when the
 * diagram viewport changes (pan/zoom) or when nodes are added/removed/updated.
 *
 * The minimap also supports navigation: click and drag on the minimap to pan
 * the diagram viewport to different areas.
 *
 * @public
 * @since 0.9.1
 * @category Components
 */
@Component({
  selector: 'ng-diagram-minimap',
  standalone: true,
  imports: [NgDiagramMinimapNavigationDirective],
  templateUrl: './ng-diagram-minimap.component.html',
  styleUrls: ['./ng-diagram-minimap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'position()',
  },
})
export class NgDiagramMinimapComponent implements OnDestroy {
  private readonly VIEWPORT_STROKE_WIDTH_CSS_VAR = '--ngd-minimap-viewport-stroke-width';

  private readonly modelService = inject(NgDiagramModelService);
  private readonly renderer = inject(RendererService);
  private readonly elementRef = inject(ElementRef);
  private readonly minimapProviderService = inject(MinimapProviderService);

  /** Position of the minimap panel within the diagram container. */
  position = input<NgDiagramPanelPosition>('bottom-right');

  /** Width of the minimap in pixels. */
  width = input<number>(200);

  /** Height of the minimap in pixels. */
  height = input<number>(150);

  constructor() {
    this.minimapProviderService.register(this);
  }

  /** @ignore */
  ngOnDestroy(): void {
    this.minimapProviderService.unregister();
  }

  isDiagramInitialized = this.renderer.isInitialized;
  nodes = this.renderer.nodes;
  viewport = this.renderer.viewport;

  diagramBounds = computed(() => {
    const nodes = this.nodes();
    return this.modelService.computePartsBounds(nodes, []);
  });

  transform = computed(() =>
    calculateMinimapTransform(this.combinedBounds(), this.width(), this.height(), this.getStrokePadding())
  );

  minimapNodes = computed(() => this.nodes().map((node: Node) => transformNodeToMinimapSpace(node, this.transform())));

  hasValidViewport = computed(() => {
    const viewport = this.viewport();
    return !!viewport.width && !!viewport.height && viewport.width > 0 && viewport.height > 0;
  });

  viewportRect = computed(() => transformViewportToMinimapSpace(this.viewport(), this.transform()));

  private viewportBoundsInDiagramSpace = computed(() => convertViewportToDiagramBounds(this.viewport()));

  private combinedBounds = computed(() =>
    combineDiagramAndViewportBounds(this.diagramBounds(), this.viewportBoundsInDiagramSpace())
  );

  /**
   * Reads viewport stroke width from CSS to use as internal padding.
   * This prevents the viewport rectangle stroke from being clipped at minimap edges.
   */
  private getStrokePadding(): number {
    const style = getComputedStyle(this.elementRef.nativeElement);
    const strokeWidth = style.getPropertyValue(this.VIEWPORT_STROKE_WIDTH_CSS_VAR).trim();

    return parseFloat(strokeWidth) || 1;
  }
}
