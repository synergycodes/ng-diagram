import { AfterViewInit, ChangeDetectionStrategy, Component, inject, signal, Type } from '@angular/core';
import {
  AngularAdapterDiagramComponent,
  FlowCoreProviderService,
  INodeTemplate,
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
export class AppComponent implements AfterViewInit {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  model = signal<SignalModelAdapter>(new SignalModelAdapter());
  nodeTemplateMap: NodeTemplateMap = new Map<string, Type<INodeTemplate>>([
    ['input-field', InputFieldNodeComponent],
    ['image', ImageNodeComponent],
    ['resizable', ResizableNodeComponent],
  ]);

  constructor() {
    this.model().setNodes([
      { id: '1', type: 'input-field', position: { x: 300, y: 300 }, data: {}, autoSize: true },
      { id: '2', type: 'image', position: { x: 500, y: 300 }, data: { imageUrl: 'https://tinyurl.com/bddnt44s' } },
      { id: '3', type: 'unknown', position: { x: 700, y: 300 }, data: {} },
      { id: '4', type: 'resizable', position: { x: 750, y: 300 }, data: {}, autoSize: true },
    ]);
    this.model().setEdges([
      {
        id: '4',
        source: '1',
        target: '2',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
      },
      {
        id: '5',
        source: '2',
        target: '3',
        data: {},
        sourceArrowhead: 'angularflow-arrow',
        targetArrowhead: 'angularflow-arrow',
      },
    ]);
  }

  ngAfterViewInit() {
    this.flowCoreProvider.provide().registerMiddleware(loggerMiddleware);
  }
}
