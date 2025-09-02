import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramContextComponent,
  type NgDiagramConfig,
  type NgDiagramNodeTemplateMap,
} from '@angularflow/angular-adapter';
import { createSignalModel } from '@angularflow/angular-signals-model';

import { CustomNodeComponent } from './node.component';

@Component({
  selector: 'customnode',
  imports: [NgDiagramComponent, NgDiagramContextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-diagram-context>
      <div class="not-content diagram">
        <ng-diagram
          [model]="model"
          [config]="config"
          [nodeTemplateMap]="nodeTemplateMap"
        />
      </div>
    </ng-diagram-context>
  `,
  styles: [
    `
      :host {
        flex: 1;
        display: flex;
      }
      .diagram {
        flex: 1;
        display: flex;
        height: 20rem;
        font-family: 'Poppins', sans-serif;
      }
    `,
  ],
})
export class CustomNodeWrapperComponent {
  nodeTemplateMap: NgDiagramNodeTemplateMap = new Map([
    ['customNodeType', CustomNodeComponent],
  ]);

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  model = createSignalModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        type: 'customNodeType',
        data: {},
      },
    ],
    edges: [],
    metadata: { viewport: { x: 0, y: 0, scale: 1.25 } },
  });
}
