import { PaletteItem } from '@angularflow/angular-adapter';
import { NodeTemplateType } from './node-template';

export const paletteModel: PaletteItem[] = [
  {
    type: NodeTemplateType.InputFiled,
    data: {},
  },
  { type: NodeTemplateType.Image, data: { imageUrl: 'https://tinyurl.com/bddnt44s' } },
  { type: NodeTemplateType.Resizable, data: {}, resizable: true },
  { type: NodeTemplateType.Group, data: {}, isGroup: true },
];
