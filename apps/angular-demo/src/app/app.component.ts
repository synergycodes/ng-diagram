import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import {
  AngularAdapterDiagramComponent,
  EdgeTemplateMap,
  IEdgeTemplate,
  Middleware,
  NodeTemplateMap,
  PaletteNode,
} from '@angularflow/angular-adapter';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { nodeTemplateMap } from './data/node-template';
import { paletteModel } from './data/palette-model';
import { ButtonEdgeComponent } from './edge-template/button-edge/button-edge.component';
import { CustomBezierEdgeComponent } from './edge-template/custom-bezier-edge/custom-bezier-edge.component';
import { AppMiddlewares, appMiddlewares } from './flow/flow.config';
import { PaletteComponent } from './palette/palette.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [ToolbarComponent, PaletteComponent, AngularAdapterDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  model = signal(new SignalModelAdapter<AppMiddlewares>());
  nodeTemplateMap: NodeTemplateMap = nodeTemplateMap;
  edgeTemplateMap: EdgeTemplateMap = new Map<string, Type<IEdgeTemplate>>([
    ['button-edge', ButtonEdgeComponent],
    ['custom-bezier-edge', CustomBezierEdgeComponent],
  ]);
  middlewares = signal<Middleware[]>(appMiddlewares);
  paletteModel: PaletteNode[] = paletteModel;

  constructor() {
    this.model().setMetadata((metadata) => ({ ...metadata, viewport: { x: 300, y: 0, scale: 1 } }));
    this.model().setNodes([
      {
        id: '1',
        type: 'image',
        position: { x: 100, y: 200 },
        data: { imageUrl: 'https://tinyurl.com/bddnt44s' },
        resizable: true,
      },
      { id: '2', type: 'input-field', position: { x: 400, y: 250 }, data: {}, resizable: true },
      { id: '3', type: 'resizable', position: { x: 700, y: 200 }, data: {}, resizable: true, groupId: '2' },
      {
        id: '4',
        type: 'group',
        isGroup: true,
        position: { x: 100, y: 400 },
        data: { title: 'Group 1' },
        resizable: true,
      },
      {
        id: '5',
        type: 'group',
        isGroup: true,
        position: { x: 300, y: 400 },
        data: { title: 'Group 2' },
        resizable: true,
      },
    ]);
    this.model().setEdges([
      {
        id: '1',
        source: '1',
        target: '2',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left',
        type: 'custom-bezier-edge',
      },
      {
        id: '2',
        source: '2',
        target: '3',
        data: {},
        sourcePort: 'port-right',
        targetPort: 'port-left-1',
        type: 'button-edge',
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
