/* eslint-disable @angular-eslint/component-selector */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MinimapBounds, MinimapNodeStyle } from '../ng-diagram-minimap.types';

/**
 * Internal default component for rendering minimap nodes as SVG shapes.
 * Renders directly in SVG context (not inside foreignObject) using
 * pre-transformed minimap coordinates.
 *
 * @internal
 */

@Component({
  selector: 'g[ng-diagram-default-minimap-node]',
  standalone: true,
  templateUrl: './ng-diagram-default-minimap-node.component.html',
  styleUrl: './ng-diagram-default-minimap-node.component.scss',
  host: {
    '[class]': 'hostClass()',
    '[attr.transform]': 'bounds().transform',
    '[style.fill]': 'computedStyle().fill',
    '[style.stroke]': 'computedStyle().stroke',
    '[style.stroke-width.px]': 'computedStyle().strokeWidth',
    '[style.opacity]': 'computedStyle().opacity',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramDefaultMinimapNodeComponent {
  bounds = input.required<MinimapBounds>();
  nodeStyle = input<MinimapNodeStyle>();

  computedStyle = computed(() => this.nodeStyle() ?? {});
  shape = computed(() => this.computedStyle().shape ?? 'rect');

  /** Host class combining base class with optional custom cssClass. */
  hostClass = computed(() => {
    const cssClass = this.computedStyle().cssClass;
    return cssClass ? `minimap-node ${cssClass}` : 'minimap-node';
  });

  cx = computed(() => this.bounds().x + this.bounds().width / 2);
  cy = computed(() => this.bounds().y + this.bounds().height / 2);
  radius = computed(() => Math.min(this.bounds().width, this.bounds().height) / 2);
  rx = computed(() => this.bounds().width / 2);
  ry = computed(() => this.bounds().height / 2);
}
