import { NgDiagramNodeTemplateMap } from 'ng-diagram';
import { ChipNodeComponent } from '../node-template/chip-node/chip-node.component';
import { CustomizedDefaultNodeComponent } from '../node-template/customized-default-node/customized-default-node.component';
import { GroupNodeComponent } from '../node-template/group-node/group-node.component';
import { ImageNodeComponent } from '../node-template/image-node/image-node.component';
import { InputFieldNodeComponent } from '../node-template/input-field-node/input-field-node.component';
import { PortToggleNodeComponent } from '../node-template/port-toggle-node/port-toggle-node.component';
import { ResizableNodeComponent } from '../node-template/resizable-node/resizable-node.component';

export enum NodeTemplateType {
  InputField = 'input-field',
  Image = 'image',
  Resizable = 'resizable',
  CustomizedDefault = 'customized-default',
  Group = 'custom-group',
  Chip = 'chip',
  PortToggle = 'port-toggle',
}

export const nodeTemplateMap = new NgDiagramNodeTemplateMap([
  [NodeTemplateType.InputField, InputFieldNodeComponent],
  [NodeTemplateType.Image, ImageNodeComponent],
  [NodeTemplateType.Resizable, ResizableNodeComponent],
  [NodeTemplateType.Group, GroupNodeComponent],
  [NodeTemplateType.CustomizedDefault, CustomizedDefaultNodeComponent],
  [NodeTemplateType.Chip, ChipNodeComponent],
  [NodeTemplateType.PortToggle, PortToggleNodeComponent],
]);
