import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

// @section-start:usage
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
  config = {
    zoom: {
      max: 2,
      zoomToFit: {
        onInit: true,
      },
    },
    snapping: {
      shouldSnapDragForNode: () => true,
      computeSnapForNodeDrag: () => ({ width: 20, height: 20 }),
      defaultDragSnap: { width: 20, height: 20 },
    },
  } satisfies NgDiagramConfig;
  // @section-end:usage

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
