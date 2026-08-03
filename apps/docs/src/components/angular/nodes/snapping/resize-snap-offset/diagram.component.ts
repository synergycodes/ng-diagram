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
    resize: {
      // The node cannot get smaller than its 60px "header"
      getMinNodeSize: () => ({ width: 100, height: 60 }),
    },
    snapping: {
      shouldSnapResizeForNode: () => true,
      computeSnapForNodeSize: () => ({ width: 20, height: 50 }),
      // Heights snap to 60, 110, 160, ... (offset + n * snap)
      computeSnapOffsetForNodeSize: () => ({ width: 0, height: 60 }),
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
