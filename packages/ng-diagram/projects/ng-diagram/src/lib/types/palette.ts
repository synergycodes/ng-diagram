import { GroupNode, SimpleNode } from '../../core/src';

/**
 * The {@link NgDiagramPaletteItem} represents the data structure for items that can be shown in the diagram palette
 * and dragged onto the canvas to create nodes or groups.
 * It supports both simple nodes and group nodes, allowing you to specify
 * properties such as type, data, size, rotation, and grouping.
 *
 * Example usage:
 * ```typescript
 * const paletteItem: NgDiagramPaletteItem = {
 *   type: 'customNode',
 *   data: { label: 'My Node' },
 *   resizable: true,
 *   rotatable: false,
 * };
 * ```
 * @category Types/Palette
 */
export type NgDiagramPaletteItem<Data extends object = BasePaletteItemData> =
  | SimpleNodeData<Data>
  | GroupNodeData<Data>;

/**
 * Data structure for node palette items. Contains the essential properties needed to create a fully configured node from the palette.
 * @category Types/Palette
 */
export type SimpleNodeData<Data extends object = BasePaletteItemData> = Pick<
  SimpleNode<Data>,
  'type' | 'data' | 'resizable' | 'rotatable' | 'size' | 'angle' | 'autoSize' | 'zOrder'
>;

/**
 * Data structure for group node palette items. Extends {@link SimpleNodeData} with the {@link GroupNode#isGroup} property to identify it as a group.
 * @category Types/Palette
 */
export type GroupNodeData<Data extends object = BasePaletteItemData> = SimpleNodeData<Data> &
  Pick<GroupNode, 'isGroup'>;

/**
 * Base data interface for palette items. All palette item data should extend this interface and include at minimum a `label` property.
 *
 * @category Types/Palette
 */
export interface BasePaletteItemData {
  /**
   * The display label for the palette item.
   */
  label: string;
}
