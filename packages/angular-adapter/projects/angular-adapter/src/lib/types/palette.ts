import { GroupNode, SimpleNode } from '@angularflow/core';

export type NgDiagramPaletteItem = SimpleNodeData | GroupNodeData;

type SimpleNodeData = Pick<
  SimpleNode,
  'type' | 'data' | 'resizable' | 'rotatable' | 'size' | 'angle' | 'autoSize' | 'zOrder'
>;
type GroupNodeData = SimpleNodeData & Pick<GroupNode, 'isGroup'>;
