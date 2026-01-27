import { InputSignal, Type } from '@angular/core';
import { Node } from '../../../core/src';

/**
 * Represents the calculated transform data for minimap rendering.
 */
export interface MinimapTransform {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Pre-computed node data for minimap rendering.
 * Contains transformed bounds, original node reference, styling, and optional custom template.
 */
export interface MinimapNodeData {
  bounds: MinimapBounds;
  diagramNode: Node;
  nodeStyle: MinimapNodeStyle;
  template: Type<NgDiagramMinimapNodeTemplate> | null;
}

/**
 * Bounding box and transform for a node in minimap coordinate space.
 *
 * @public
 * @since 1.0.0
 * @category Types/Minimap
 */
export interface MinimapBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  transform: string;
}

/**
 * Represents the viewport rectangle in minimap space.
 */
export interface MinimapViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Available shapes for minimap node rendering.
 *
 * @public
 * @since 1.0.0
 * @category Types/Minimap
 */
export type MinimapNodeShape = 'rect' | 'circle' | 'ellipse';

/**
 * Style properties that can be applied to minimap nodes.
 * All properties are optional - unset properties use CSS defaults.
 *
 * @public
 * @since 1.0.0
 * @category Types/Minimap
 */
export interface MinimapNodeStyle {
  /** Shape of the node in the minimap. Defaults to 'rect'. */
  shape?: MinimapNodeShape;
  /** Fill color for the node */
  fill?: string;
  /** Stroke color for the node */
  stroke?: string;
  /** Stroke width in pixels */
  strokeWidth?: number;
  /** Opacity from 0 to 1 */
  opacity?: number;
  /** CSS class to apply to the node */
  cssClass?: string;
}

/**
 * Function signature for the nodeStyle callback.
 * Return style properties to override defaults, or null/undefined to use defaults.
 *
 * @public
 * @since 1.0.0
 * @category Types/Minimap
 *
 * @example
 * ```typescript
 * const nodeStyle: MinimapNodeStyleFn = (node) => ({
 *   fill: node.type === 'database' ? '#4CAF50' : '#9E9E9E',
 *   opacity: node.selected ? 1 : 0.6,
 * });
 * ```
 */
export type MinimapNodeStyleFn = (node: Node) => MinimapNodeStyle | null | undefined;

/**
 * Interface for custom minimap node components.
 * Components implementing this interface can be registered in NgDiagramMinimapNodeTemplateMap
 * to customize how specific node types are rendered in the minimap.
 *
 * Custom templates are rendered inside a foreignObject that handles positioning and sizing,
 * so the component only needs to render content that fills its container.
 *
 * @public
 * @since 1.0.0
 * @category Types/Minimap
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'my-minimap-node',
 *   standalone: true,
 *   template: `
 *     <div class="minimap-icon" [style.background]="node().data?.color">
 *       {{ node().type }}
 *     </div>
 *   `,
 *   styles: [`.minimap-icon { width: 100%; height: 100%; }`]
 * })
 * export class MyMinimapNodeComponent implements NgDiagramMinimapNodeTemplate {
 *   node = input.required<Node>();
 *   nodeStyle = input<MinimapNodeStyle>(); // Required by interface, can be ignored if not needed
 * }
 * ```
 */
export interface NgDiagramMinimapNodeTemplate {
  /** Input signal containing the original Node object for accessing node data, type, etc. */
  node: InputSignal<Node>;
  /** Input signal for style overrides computed by nodeStyle callback. Can be ignored if not needed. */
  nodeStyle: InputSignal<MinimapNodeStyle | undefined>;
}

/**
 * Map that associates node type names with their corresponding minimap Angular component classes.
 * Used by ng-diagram-minimap to determine which custom component to render based on node type.
 *
 * @public
 * @since 1.0.0
 * @category Types/Minimap
 *
 * @example
 * ```typescript
 * const minimapTemplateMap = new NgDiagramMinimapNodeTemplateMap([
 *   ['database', DatabaseMinimapNodeComponent],
 *   ['api', ApiMinimapNodeComponent],
 * ]);
 *
 * // Usage in template:
 * <ng-diagram-minimap [minimapNodeTemplateMap]="minimapTemplateMap" />
 * ```
 */
export class NgDiagramMinimapNodeTemplateMap extends Map<string, Type<NgDiagramMinimapNodeTemplate>> {}
