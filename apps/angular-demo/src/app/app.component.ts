import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import {
  AngularAdapterDiagramComponent,
  INodeTemplate,
  Middleware,
  NodeTemplateMap,
} from '@angularflow/angular-adapter';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { loggerMiddleware } from '@angularflow/logger-middleware';

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
  ]);
  middlewares = signal<Middleware[]>([loggerMiddleware]);

  constructor() {
    this.model().setNodes([
      { id: '1', type: 'image', position: { x: 0, y: 200 }, data: { imageUrl: 'https://tinyurl.com/bddnt44s' } },
      { id: '2', type: 'input-field', position: { x: 200, y: 250 }, data: {}, autoSize: true },
      { id: '3', type: 'resizable', position: { x: 400, y: 200 }, data: {}, autoSize: true },
    ]);
    this.model().setEdges([
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-left',
        targetPort: 'port-right',
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
      },
      {
        id: '3',
        source: '2',
        target: '3',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right',
        targetPort: 'port-left-2',
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
