import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import {
  createSignalModel,
  NgDiagramComponent,
  NgDiagramEdgeTemplate,
  NgDiagramEdgeTemplateMap,
  NgDiagramModule,
  NgDiagramNodeTemplateMap,
  NgDiagramPaletteItem,
} from '@angularflow/angular-adapter';
import { nodeTemplateMap } from './data/node-template';
import { paletteModel } from './data/palette-model';
import { ButtonEdgeComponent } from './edge-template/button-edge/button-edge.component';
import { CustomBezierEdgeComponent } from './edge-template/custom-bezier-edge/custom-bezier-edge.component';
import { PaletteComponent } from './palette/palette.component';
import { ToolbarComponent } from './toolbar/toolbar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [ToolbarComponent, PaletteComponent, NgDiagramComponent, NgDiagramModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  paletteModel: NgDiagramPaletteItem[] = paletteModel;
  nodeTemplateMap: NgDiagramNodeTemplateMap = nodeTemplateMap;
  edgeTemplateMap: NgDiagramEdgeTemplateMap = new Map<string, Type<NgDiagramEdgeTemplate>>([
    ['button-edge', ButtonEdgeComponent],
    ['custom-bezier-edge', CustomBezierEdgeComponent],
  ]);

  debugMode = signal(true);

  config = {
    zoom: {
      max: 2,
    },
  };

  model = createSignalModel({
    nodes: [
      {
        id: '1',
        type: 'image',
        position: { x: 100, y: 200 },
        data: { imageUrl: 'https://tinyurl.com/bddnt44s' },
        resizable: true,
      },
      { id: '2', type: 'input-field', position: { x: 400, y: 250 }, data: {}, resizable: true },
      { id: '3', type: 'resizable', position: { x: 700, y: 200 }, data: {}, resizable: true },
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
      {
        id: '6',
        position: { x: 500, y: 400 },
        data: {},
        resizable: true,
        rotatable: true,
      },
      {
        id: '7',
        position: { x: 800, y: 400 },
        data: {},
        resizable: true,
        isGroup: true,
      },
    ],
    edges: [
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
        sourceArrowhead: 'ng-diagram-arrow',
        targetArrowhead: 'ng-diagram-arrow',
        sourcePort: 'port-right',
        targetPort: 'port-left-3',
      },
    ],
    metadata: { viewport: { x: 300, y: 0, scale: 1 } },
  });
}
