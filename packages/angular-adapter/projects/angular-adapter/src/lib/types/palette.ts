import { Node } from '@angularflow/core';

export type PaletteItem = Pick<Node, 'type' | 'data' | 'isGroup' | 'resizable'>;
