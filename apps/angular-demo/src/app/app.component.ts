import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import {
  AngularAdapterDiagramComponent,
  INodeTemplate,
  Middleware,
  Node,
  NodeTemplateMap,
} from '@angularflow/angular-adapter';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
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
  middlewares = signal<Middleware[]>([]);

  constructor() {
    const nodes = Array.from(
      { length: 1000 },
      (_, i) =>
        ({
          id: `${i + 1}`,
          type: 'resizable',
          position: {
            x: Math.random() * 2000,
            y: Math.random() * 2000,
          },
          data: {},
          resizable: true,
          angle: 0,
          autoSize: true,
          ports: [],
          selected: false,
          size: { width: 100, height: 100 },
          zOrder: 0,
        }) satisfies Node
    );
    const t1 = performance.now();
    const nodesMap = new Map<string, Node>(nodes.map((node) => [node.id, node]));
    const t2 = performance.now();
    console.log(t2 - t1);
    console.log(nodesMap);

    this.model().setNodes(nodes);
    this.model().setNodes([
      {
        id: '1',
        type: 'image',
        position: { x: 100, y: 200 },
        data: { imageUrl: 'https://tinyurl.com/bddnt44s' },
        resizable: true,
      },
      { id: '2', type: 'input-field', position: { x: 400, y: 250 }, data: {}, resizable: true },
      { id: '3', type: 'resizable', position: { x: 700, y: 200 }, data: {}, resizable: true },
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
