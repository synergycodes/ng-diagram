import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  createSignalModel,
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'diagram',
  templateUrl: './diagram.component.html',
  styleUrl: './diagram.component.scss',
  imports: [NgDiagramComponent, NgDiagramContextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiagramComponent {
  config = {
    zoom: {
      max: 5,
    },
  } satisfies NgDiagramConfig;

  model = createSignalModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 150 },
        data: {},
        resizable: true,
      },
      {
        id: '2',
        position: { x: 400, y: 150 },
        data: {},
        resizable: false,
      },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        target: '2',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        data: {},
      },
    ],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });
}
