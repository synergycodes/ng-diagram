import { GroupNode, SimpleNode } from '@angularflow/core';

export type PaletteItem = SimpleNodeData | GroupNodeData;

type SimpleNodeData = Pick<SimpleNode, 'type' | 'data' | 'resizable' | 'rotatable'>;
type GroupNodeData = SimpleNodeData & Pick<GroupNode, 'isGroup'>;
