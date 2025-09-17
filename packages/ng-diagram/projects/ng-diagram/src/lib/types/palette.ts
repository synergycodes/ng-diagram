import { GroupNode, SimpleNode } from '@ng-diagram/core';

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
