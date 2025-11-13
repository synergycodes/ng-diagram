import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
})
export class DiagramComponent {
  // @section-start:config
  config = {
    zoom: {
      max: 2,
      zoomToFit: {
        onInit: true,
      },
    },
    snapping: {
      shouldSnapResizeForNode: () => true,
      computeSnapForNodeSize: () => ({ width: 20, height: 20 }),
      defaultResizeSnap: { width: 20, height: 20 },
    },
  } satisfies NgDiagramConfig;
  // @section-end:config

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: 'Node' },
      },
    ],
  });
}
