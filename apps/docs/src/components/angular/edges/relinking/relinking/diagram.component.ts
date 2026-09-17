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
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styles: `
    .diagram {
      display: flex;
      height: var(--ng-diagram-height);
      border: var(--ng-diagram-border);
    }
  `,
})
export class DiagramComponent {
  // @section-start:config
  config = {
    // @collapse-start:config
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 80,
      },
    },
    // @collapse-end:config
    linking: {
      // Both ends of every edge, unless the edge sets its own `relinkable`
      // @mark-start:config
      defaultRelinkable: true,
      // @mark-end:config
    },
    // A handle dropped on empty canvas detaches that end instead of reverting
    danglingEdges: {
      enabled: true,
    },
  } satisfies NgDiagramConfig;
  // @section-end:config

  // @section-start:relinkable
  model = initializeModel({
    // @collapse-start:relinkable
    nodes: [
      { id: 'a', position: { x: 100, y: 60 }, data: { label: 'A' } },
      { id: 'b', position: { x: 550, y: 60 }, data: { label: 'B' } },
      { id: 'c', position: { x: 100, y: 190 }, data: { label: 'C' } },
      { id: 'd', position: { x: 550, y: 190 }, data: { label: 'D' } },
      { id: 'e', position: { x: 100, y: 320 }, data: { label: 'E' } },
      { id: 'f', position: { x: 550, y: 320 }, data: { label: 'F' } },
    ],
    // @collapse-end:relinkable
    edges: [
      {
        id: 'both-ends',
        source: 'a',
        sourcePort: 'port-right',
        target: 'b',
        targetPort: 'port-left',
        // No `relinkable`: the config default applies
        data: { label: 'both ends' },
      },
      {
        id: 'target-only',
        source: 'c',
        sourcePort: 'port-right',
        target: 'd',
        targetPort: 'port-left',
        // @mark-start:relinkable
        relinkable: 'target',
        // @mark-end:relinkable
        data: { label: 'target end only' },
      },
      {
        id: 'locked',
        source: 'e',
        sourcePort: 'port-right',
        target: 'f',
        targetPort: 'port-left',
        // @mark-start:relinkable
        relinkable: false,
        // @mark-end:relinkable
        data: { label: 'locked' },
      },
    ],
  });
  // @section-end:relinkable
}
