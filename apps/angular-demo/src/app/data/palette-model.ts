import { PaletteItem } from '@angularflow/angular-adapter';
import { NodeTemplateType } from './node-template';

export const paletteModel: PaletteItem[] = [
  {
    type: NodeTemplateType.InputFiled,
    data: { label: 'Input Field' },
  },
  { type: NodeTemplateType.Image, data: { label: 'Image', imageUrl: 'https://tinyurl.com/bddnt44s' } },
  { type: NodeTemplateType.Resizable, data: { label: 'Resizable' }, resizable: true },
  { type: NodeTemplateType.Group, data: { label: 'Group' }, isGroup: true },
];
