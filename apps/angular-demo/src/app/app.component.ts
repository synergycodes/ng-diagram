import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import {
  AngularAdapterDiagramComponent,
  INodeTemplate,
  Middleware,
  NodeTemplateMap,
} from '@angularflow/angular-adapter';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { loggerMiddleware } from '@angularflow/logger-middleware';
import { GroupNodeComponent } from './node-template/group-node/group-node.component';
import { ImageNodeComponent } from './node-template/image-node/image-node.component';
import { InputFieldNodeComponent } from './node-template/input-field-node/input-field-node.component';
import { ResizableNodeComponent } from './node-template/resizable-node/resizable-node.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [AngularAdapterDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  model = signal<SignalModelAdapter>(new SignalModelAdapter());
  nodeTemplateMap: NodeTemplateMap = new Map<string, Type<INodeTemplate>>([
    ['input-field', InputFieldNodeComponent],
    ['image', ImageNodeComponent],
    ['resizable', ResizableNodeComponent],
    ['group', GroupNodeComponent],
  ]);
  middlewares = signal<Middleware[]>([loggerMiddleware]);

  constructor() {
    this.model().setNodes([
      {
        id: '1',
        type: 'image',
        position: { x: 100, y: 200 },
        data: { imageUrl: 'https://tinyurl.com/bddnt44s' },
        resizable: true,
        angle: 0,
      },
      { id: '2', type: 'input-field', position: { x: 400, y: 250 }, data: {}, resizable: true, angle: 0 },
      { id: '3', type: 'resizable', position: { x: 700, y: 200 }, data: {}, resizable: true, angle: 0, groupId: '2' },
      {
        id: '4',
        type: 'group',
        isGroup: true,
        position: { x: 100, y: 400 },
        data: { title: 'Group 1' },
        resizable: true,
        angle: 0,
        zOrder: 1,
      },
      {
        id: '5',
        type: 'group',
        isGroup: true,
        position: { x: 300, y: 400 },
        data: { title: 'Group 2' },
        resizable: true,
        angle: 0,
        zOrder: 2,
      },
    ]);
    this.model().setEdges([
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        routing: 'orthogonal',
      },
      {
        id: '2',
        source: '2',
        target: '3',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right',
        targetPort: 'port-left-1',
        routing: 'orthogonal',
      },
      {
        id: '4',
        source: '2',
        target: '3',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right',
        targetPort: 'port-left-3',
      },
    ]);
  }
}
