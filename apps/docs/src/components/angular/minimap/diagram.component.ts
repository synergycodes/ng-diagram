import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramMinimapComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [
    NgDiagramComponent,
    NgDiagramBackgroundComponent,
    NgDiagramMinimapComponent,
  ],
  providers: [provideNgDiagram()],
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: [50, 250, 50, 50],
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 300, y: 0 }, data: { label: 'Node 2' } },
      { id: '3', position: { x: 150, y: 150 }, data: { label: 'Node 3' } },
      { id: '4', position: { x: 0, y: 300 }, data: { label: 'Node 4' } },
      { id: '5', position: { x: 300, y: 300 }, data: { label: 'Node 5' } },
    ],
    edges: [
      {
        id: 'e1',
        source: '1',
        sourcePort: 'port-right',
        target: '2',
        targetPort: 'port-left',
        data: {},
      },
      {
        id: 'e2',
        source: '4',
        sourcePort: 'port-right',
        target: '5',
        targetPort: 'port-left',
        data: {},
      },
    ],
  });
}
