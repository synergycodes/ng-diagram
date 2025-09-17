import { NgDiagramPaletteItem } from 'ng-diagram';
import { NodeTemplateType } from './node-template';

export const paletteModel: NgDiagramPaletteItem<Data>[] = [
  {
    type: NodeTemplateType.InputField,
    data: { label: 'Input Field' },
  },
  { type: NodeTemplateType.Image, data: { label: 'Image', imageUrl: 'https://tinyurl.com/bddnt44s' } },
  { type: NodeTemplateType.Resizable, data: { label: 'Resizable' }, resizable: true },
  { type: NodeTemplateType.Group, data: { label: 'Group' }, isGroup: true },
  { data: { label: 'Default Node' }, resizable: true, rotatable: true },
  { data: { label: 'Default Group' }, resizable: true, isGroup: true },
];

interface Data {
  label: string;
  imageUrl?: string;
}
