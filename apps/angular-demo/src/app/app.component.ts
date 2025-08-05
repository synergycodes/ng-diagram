import { ChangeDetectionStrategy, Component, signal, Type } from '@angular/core';
import {
  createSignalModel,
  NgDiagramComponent,
  NgDiagramConfig,
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

  config: NgDiagramConfig = {
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
        rotatable: true,
        rotationCenter: { x: 0.1, y: 0.1 }, // Rotate around point at 10% from top-left
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
        size: { width: 300, height: 200 },
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
        data: { label: 'Bottom-right rotation' },
        resizable: true,
        rotatable: true,
        size: { width: 150, height: 100 },
        rotationCenter: { x: 1, y: 1 }, // Rotate around bottom-right corner
      },
      {
        id: '7',
        position: { x: 800, y: 400 },
        data: {},
        resizable: true,
        isGroup: true,
      },
      {
        id: '8',
        type: 'resizable',
        position: { x: 150, y: 450 },
        data: { label: 'Rotated in group' },
        resizable: true,
        rotatable: true,
        angle: 45,
        size: { width: 100, height: 60 },
        groupId: '4', // Add to Group 1
        rotationCenter: { x: 0, y: 0.5 }, // Rotate around left-center edge
      },
      {
        id: '9',
        type: 'resizable',
        position: { x: 250, y: 500 },
        data: { label: 'Another rotated' },
        resizable: true,
        rotatable: true,
        angle: -30,
        size: { width: 80, height: 40 },
        groupId: '4', // Also in Group 1
        rotationCenter: { x: 0.5, y: 0.5 }, // Rotate around center
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
