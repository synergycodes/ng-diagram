import { Type } from '@angular/core';
import {
  NgDiagramGroupNodeTemplate,
  NgDiagramNodeTemplate,
  NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';
import { GroupNodeComponent } from '../node-template/group-node/group-node.component';
import { ImageNodeComponent } from '../node-template/image-node/image-node.component';
import { InputFieldNodeComponent } from '../node-template/input-field-node/input-field-node.component';
import { ResizableNodeComponent } from '../node-template/resizable-node/resizable-node.component';

export enum NodeTemplateType {
  InputField = 'input-field',
  Image = 'image',
  Resizable = 'resizable',
  Group = 'group',
}

export const nodeTemplateMap: NgDiagramNodeTemplateMap = new Map<
  NodeTemplateType,
  Type<NgDiagramNodeTemplate> | Type<NgDiagramGroupNodeTemplate>
>([
  [NodeTemplateType.InputField, InputFieldNodeComponent],
  [NodeTemplateType.Image, ImageNodeComponent],
  [NodeTemplateType.Resizable, ResizableNodeComponent],
  [NodeTemplateType.Group, GroupNodeComponent],
]);
