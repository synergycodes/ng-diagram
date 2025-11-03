import '@angular/compiler';

import { Component, signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import {
  SidebarContainer,
  type BackgroundStyle,
} from './sidebar/sidebar.component';

@Component({
  imports: [NgDiagramComponent, SidebarContainer, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  templateUrl: './diagram.component.html',
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  backgroundStyle = signal<BackgroundStyle>('dot');

  onBackgroundStyleChange(style: BackgroundStyle) {
    this.backgroundStyle.set(style);
  }

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: [50, 315, 50, 50],
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 400, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        data: {},
      },
    ],
  });
}
