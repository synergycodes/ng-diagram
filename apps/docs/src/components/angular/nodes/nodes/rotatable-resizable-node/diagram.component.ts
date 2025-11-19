// @section-start
import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  // @collapse-start
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content rotatable-resizable-diagram">
      <ng-diagram [config]="config" [model]="model">
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styles: `
    .rotatable-resizable-diagram {
      display: flex;
      height: var(--ng-diagram-height);
      border: var(--ng-diagram-border);
    }
  `,
  // @collapse-end
})
export class DiagramComponent {
  // @collapse-start
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 190,
      },
    },
  } satisfies NgDiagramConfig;
  // @collapse-end

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' },
        // @mark-start
        rotatable: true,
        resizable: true,
        // @mark-end
      },
    ],
  });
}
// @section-end
