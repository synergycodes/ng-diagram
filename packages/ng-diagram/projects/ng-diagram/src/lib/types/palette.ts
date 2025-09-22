import { GroupNode, SimpleNode } from '../../core/src';

/**
 * The `NgDiagramPaletteItem` represents the data structure for items that can be shown in the diagram palette
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
 * @category Types
 */
export type NgDiagramPaletteItem<Data extends object = BasePaletteItemData> =
  | SimpleNodeData<Data>
  | GroupNodeData<Data>;

type SimpleNodeData<Data extends object = BasePaletteItemData> = Pick<
  SimpleNode<Data>,
  'type' | 'data' | 'resizable' | 'rotatable' | 'size' | 'angle' | 'autoSize' | 'zOrder'
>;
type GroupNodeData<Data extends object = BasePaletteItemData> = SimpleNodeData<Data> & Pick<GroupNode, 'isGroup'>;

interface BasePaletteItemData {
  label: string;
}
