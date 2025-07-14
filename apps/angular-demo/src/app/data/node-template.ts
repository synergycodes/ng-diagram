import { Type } from '@angular/core';
import { InputFieldNodeComponent } from '../node-template/input-field-node/input-field-node.component';
import { ImageNodeComponent } from '../node-template/image-node/image-node.component';
import { ResizableNodeComponent } from '../node-template/resizable-node/resizable-node.component';
import { GroupNodeComponent } from '../node-template/group-node/group-node.component';
import { INodeTemplate, NodeTemplateMap } from '@angularflow/angular-adapter';

export const templateLabels = new Map<string, string>([
  ['input-field', 'Input Field'],
  ['image', 'Image'],
  ['resizable', 'Resizable'],
  ['group', 'Group'],
]);

export const nodeTemplateMap: NodeTemplateMap = new Map<string, Type<INodeTemplate>>([
  ['input-field', InputFieldNodeComponent],
  ['image', ImageNodeComponent],
  ['resizable', ResizableNodeComponent],
  ['group', GroupNodeComponent],
]);
