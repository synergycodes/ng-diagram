import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { CircleArrowheadComponent } from './circle-arrowhead.component';
import { LabeledEdgeComponent } from './labeled-edge.component';
import { SinusoidEdgeComponent } from './sinusoid-edge.component';

@Component({
  imports: [NgDiagramComponent, CircleArrowheadComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [edgeTemplateMap]="edgeTemplateMap"
        [config]="config"
      />
      <circle-arrowhead />
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['labeled', LabeledEdgeComponent],
    ['sinusoid', SinusoidEdgeComponent],
  ]);

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 200, y: 100 },
        data: { label: 'Node 1' },
      },
      {
        id: '2',
        position: { x: 700, y: 200 },
        data: { label: 'Node 2' },
      },
      {
        id: '3',
        position: { x: 200, y: 300 },
        data: { label: 'Node 3' },
      },
      {
        id: '4',
        position: { x: 700, y: 400 },
        data: { label: 'Node 4' },
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        data: {},
        sourceArrowhead: 'circle-arrowhead',
      },
      {
        id: '2',
        source: '2',
        sourcePort: 'port-left',
        targetPort: 'port-right',
        target: '3',
        type: 'labeled',
        data: {},
      },
      {
        id: '3',
        source: '3',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '4',
        type: 'sinusoid',
        data: {},
      },
    ],
  });
}
