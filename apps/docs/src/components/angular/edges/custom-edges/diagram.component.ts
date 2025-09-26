import '@angular/compiler';

import { Component } from '@angular/core';
// @collapse-start
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramEdgeTemplateMap,
  provideNgDiagram,
} from 'ng-diagram';
// @collapse-end
// @mark-start
import { CustomEdgeComponent } from './custom-edge.component';
// @mark-end

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
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
})
export class Diagram {
  // @mark-start
  edgeTemplateMap = new NgDiagramEdgeTemplateMap([
    ['custom', CustomEdgeComponent],
  ]);
  // @mark-end

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
      // @collapse-end
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
}
