import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { FlowCoreProviderService } from '../../services';
import { RendererService } from '../../services/renderer/renderer.service';
import { NgDiagramPanelPosition } from '../../types/panel-position';
import { NgDiagramPanelComponent } from '../panel/ng-diagram-panel.component';
import { NgDiagramZoomControlsComponent } from '../zoom-controls/ng-diagram-zoom-controls.component';
import { NgDiagramDefaultMinimapNodeComponent } from './default-node/ng-diagram-default-minimap-node.component';
import { NgDiagramMinimapDiagramBoundsComponent } from './diagram-bounds/ng-diagram-minimap-diagram-bounds.component';
import { NgDiagramMinimapNavigationDirective } from './ng-diagram-minimap-navigation.directive';
import {
  calculateMinimapTransform,
  combineDiagramAndViewportBounds,
  convertViewportToDiagramBounds,
  transformViewportToMinimapSpace,
} from './ng-diagram-minimap.calculations';
import {
  MinimapNodeData,
  MinimapNodeStyleFn,
  MinimapStrategy,
  NgDiagramMinimapNodeTemplateMap,
} from './ng-diagram-minimap.types';
import { DirectMinimapStrategy } from './strategy/direct-minimap-strategy';
import { VirtualizedMinimapStrategy } from './strategy/virtualized-minimap-strategy';

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
 * @since 1.0.0
 * @category Components
 */
@Component({
  selector: 'ng-diagram-minimap',
  standalone: true,
  imports: [
    NgDiagramMinimapNavigationDirective,
    CommonModule,
    NgDiagramDefaultMinimapNodeComponent,
    NgDiagramMinimapDiagramBoundsComponent,
    NgDiagramZoomControlsComponent,
    NgDiagramPanelComponent,
  ],
  templateUrl: './ng-diagram-minimap.component.html',
  styleUrls: ['./ng-diagram-minimap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DirectMinimapStrategy, VirtualizedMinimapStrategy],
  host: {
    '[class]': 'position()',
  },
})
export class NgDiagramMinimapComponent implements AfterViewInit {
  private readonly VIEWPORT_STROKE_WIDTH_CSS_VAR = '--ngd-minimap-viewport-stroke-width';

  private readonly renderer = inject(RendererService);
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly elementRef = inject(ElementRef);
  private readonly directStrategy = inject(DirectMinimapStrategy);
  private readonly virtualizedStrategy = inject(VirtualizedMinimapStrategy);

  /** Cached stroke padding to avoid layout thrashing from repeated getComputedStyle calls. */
  private strokePadding = signal<number>(1);

  /** Position of the minimap panel within the diagram container. */
  position = input<NgDiagramPanelPosition>('bottom-right');

  /** Width of the minimap in pixels. */
  width = input<number>(200);

  /** Height of the minimap in pixels. */
  height = input<number>(150);

  /** Whether to show zoom controls in the minimap footer. */
  showZoomControls = input<boolean>(true);

  /**
   * Optional callback function to customize node styling.
   * Return style properties to override defaults, or null/undefined to use CSS defaults.
   *
   * @example
   * ```typescript
   * nodeStyle = (node: Node) => ({
   *   fill: node.type === 'database' ? '#4CAF50' : '#9E9E9E',
   *   opacity: node.selected ? 1 : 0.6,
   * });
   * ```
   */
  nodeStyle = input<MinimapNodeStyleFn>();

  /**
   * Optional template map for complete control over node rendering per node type.
   * Components registered in the map should render SVG elements.
   *
   * @example
   * ```typescript
   * const minimapTemplateMap = new NgDiagramMinimapNodeTemplateMap([
   *   ['database', DatabaseMinimapNodeComponent],
   *   ['api', ApiMinimapNodeComponent],
   * ]);
   *
   * // Usage:
   * <ng-diagram-minimap [minimapNodeTemplateMap]="minimapTemplateMap" />
   * ```
   */
  minimapNodeTemplateMap = input<NgDiagramMinimapNodeTemplateMap>(new NgDiagramMinimapNodeTemplateMap());

  /** @ignore */
  ngAfterViewInit(): void {
    // Cache stroke padding after view init to avoid layout thrashing
    this.strokePadding.set(this.getStrokePaddingFromCss());
  }

  isDiagramInitialized = this.renderer.isInitialized;
  viewport = this.renderer.viewport;

  hasValidViewport = computed(() => {
    const viewport = this.viewport();
    return !!viewport.width && !!viewport.height && viewport.width > 0 && viewport.height > 0;
  });

  viewportRect = computed(() => transformViewportToMinimapSpace(this.viewport(), this.transform()));

  /**
   * @internal
   * Active minimap strategy based on virtualization mode.
   * Delegates mode-specific logic (node rendering, bounds) to the strategy.
   *
   * Note: isVirtualizationActive is a plain getter (not a signal).
   * This works because switching virtualization mode requires model recreation,
   * which triggers a full diagram re-init cycle (isInitialized: true → false → true).
   */
  private strategy = computed((): MinimapStrategy => {
    if (!this.isDiagramInitialized()) {
      return this.directStrategy;
    }
    return this.flowCoreProvider.provide().isVirtualizationActive ? this.virtualizedStrategy : this.directStrategy;
  });

  /**
   * @internal
   * Main transform for minimap - updates when viewport or diagram bounds change.
   * Used for SVG group transform and viewport rect calculation.
   */
  protected transform = computed(() =>
    calculateMinimapTransform(this.combinedBounds(), this.width(), this.height(), this.strokePadding())
  );

  /**
   * @internal
   * SVG transform attribute for the nodes group.
   * Converts diagram coordinates to minimap coordinates.
   */
  protected nodesGroupTransform = computed(() => {
    const t = this.transform();
    return `translate(${t.offsetX}, ${t.offsetY}) scale(${t.scale})`;
  });

  /**
   * @internal
   * Pre-computed minimap node data in DIAGRAM coordinates (not minimap coordinates).
   * The SVG group transform handles the coordinate conversion, so nodes only recalculate
   * when diagram content changes, NOT during pan/zoom.
   */
  protected minimapNodes = computed((): MinimapNodeData[] =>
    this.strategy().computeMinimapNodes(this.nodeStyle(), this.minimapNodeTemplateMap())
  );

  /**
   * @internal
   * Whether the diagram bounds outline should be shown on the minimap.
   * Diagram bounds are shown in virtualized mode to indicate the full diagram extent.
   */
  protected showDiagramBounds = computed(
    () => this.isDiagramInitialized() && this.flowCoreProvider.provide().isVirtualizationActive
  );

  protected diagramBounds = computed(() => this.strategy().computeDiagramBounds());

  private viewportBoundsInDiagramSpace = computed(() => convertViewportToDiagramBounds(this.viewport()));

  private combinedBounds = computed(() =>
    combineDiagramAndViewportBounds(this.diagramBounds(), this.viewportBoundsInDiagramSpace())
  );

  /**
   * Reads viewport stroke width from CSS to use as internal padding.
   * This prevents the viewport rectangle stroke from being clipped at minimap edges.
   */
  private getStrokePaddingFromCss(): number {
    const style = getComputedStyle(this.elementRef.nativeElement);
    const strokeWidth = style.getPropertyValue(this.VIEWPORT_STROKE_WIDTH_CSS_VAR).trim();

    return parseFloat(strokeWidth) || 1;
  }
}
