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
  standalone: true,
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
        layoutAngle: 90,
      },
      {
        id: '2',
        type: 'input-field',
        position: { x: 400, y: 250 },
        data: {},
        resizable: true,
        layoutAngle: 0,
      },
      {
        id: '3',
        type: 'input-field',
        position: { x: 400, y: 250 },
        data: {},
        resizable: true,
        // layoutAngle: 0,
      },
      {
        id: '4',
        type: 'input-field',
        position: { x: 400, y: 250 },
        data: {},
        resizable: true,
        // layoutAngle: 0,
      },
      {
        id: '5',
        type: 'resizable',
        position: { x: 700, y: 200 },
        data: {},
        resizable: true,
      },
      {
        id: '6',
        type: 'input-field',
        position: { x: 400, y: 250 },
        data: {},
        resizable: true,
        layoutAngle: 0,
      },
      {
        id: '7',
        type: 'input-field',
        position: { x: 400, y: 250 },
        data: {},
        resizable: true,
        angle: 0,
        // layoutAngle: 0,
      },
      {
        id: '8',
        type: 'input-field',
        position: { x: 400, y: 250 },
        data: {},
        resizable: true,
        angle: 0,
        // layoutAngle: 0,
      },
      { id: '9', type: 'group', position: { x: 100, y: 400 }, data: { title: 'Group 1' }, resizable: true, angle: 0 },
      { id: '10', type: 'group', position: { x: 300, y: 400 }, data: { title: 'Group 2' }, resizable: true, angle: 0 },
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
        source: '1',
        target: '6',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right',
        targetPort: 'port-left-6',
      },
      {
        id: '3',
        source: '2',
        target: '3',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right-2',
        targetPort: 'port-left-3',
      },
      {
        id: '4',
        source: '2',
        target: '4',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right-2',
        targetPort: 'port-left-4',
      },
      {
        id: '5',
        source: '2',
        target: '5',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right-2',
        targetPort: 'port-left-5',
      },
      {
        id: '6',
        source: '6',
        target: '7',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right-6',
        targetPort: 'port-left-7',
      },
      {
        id: '7',
        source: '6',
        target: '8',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
        sourcePort: 'port-right-6',
        targetPort: 'port-left-8',
      },
    ]);
  }
}
