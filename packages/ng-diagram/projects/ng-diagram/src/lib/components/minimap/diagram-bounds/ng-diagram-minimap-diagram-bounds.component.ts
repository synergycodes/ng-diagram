/* eslint-disable @angular-eslint/component-selector */
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Rect } from '../../../../core/src';
import { MinimapTransform } from '../ng-diagram-minimap.types';

/**
 * Internal component for rendering the diagram bounds outline on the minimap.
 * Used in virtualized mode to show the extent of the full diagram.
 *
 * @internal
 */
@Component({
  selector: 'rect[ng-diagram-minimap-diagram-bounds]',
  standalone: true,
  template: '',
  styleUrl: './ng-diagram-minimap-diagram-bounds.component.scss',
  host: {
    '[attr.x]': 'rect().x',
    '[attr.y]': 'rect().y',
    '[attr.width]': 'rect().width',
    '[attr.height]': 'rect().height',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramMinimapDiagramBoundsComponent {
  diagramBounds = input.required<Rect>();
  minimapTransform = input.required<MinimapTransform>();

  protected rect = computed(() => {
    const bounds = this.diagramBounds();
    const transform = this.minimapTransform();

    return {
      x: bounds.x * transform.scale + transform.offsetX,
      y: bounds.y * transform.scale + transform.offsetY,
      width: bounds.width * transform.scale,
      height: bounds.height * transform.scale,
    };
  });
}
