import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config" />
    </div>
  `,
  styleUrl: './diagram.component.scss',
})
export class DiagramComponent {
  // @section-start:config
  config = {
    zoom: {
      max: 3,
    },
    snapping: {
      shouldSnapResizeForNode: () => true,
      computeSnapForNodeSize: () => ({ x: 20, y: 20 }),
      defaultResizeSnap: { x: 20, y: 20 },
    },
  } satisfies NgDiagramConfig;
  // @section-end:config

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        size: { width: 260, height: 200 },
        data: { label: 'Node' },
      },
    ],
  });
}
