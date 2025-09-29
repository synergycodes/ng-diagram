import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
} from 'ng-diagram';

import { CustomEdgeComponent } from './custom-edge.component';

// @section-start
@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  // @mark-substring:[edgeTemplateMap]="edgeTemplateMap"
  // @mark-start
  template: `
    <ng-diagram [model]="model" [edgeTemplateMap]="edgeTemplateMap" />
  `,
  // @mark-end
  // @collapse-start
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
    }
  `,
  // @collapse-end
})
export class Diagram {
  // @mark-start
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['custom', CustomEdgeComponent],
  ]);
  // @mark-end
  // @collapse-start

  model = initializeModel({
    metadata: {
      viewport: { x: 0, y: 0, scale: 0.88 },
    },
    nodes: [
      {
        id: '1',
        position: { x: 150, y: 150 },
        data: { label: 'Node 1' },
        rotatable: true,
      },
      { id: '2', position: { x: 500, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        type: 'custom',
        data: {},
      },
    ],
  });
  // @collapse-end
}
// @section-end
