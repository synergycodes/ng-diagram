import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  type NgDiagramConfig,
  NgDiagramNodeTemplateMap,
  provideNgDiagram,
} from 'ng-diagram';
import { GraphNodeComponent } from '../graph-node/graph-node.component';
import { GroupNodeComponent } from '../group-node/group-node.component';
import { UserPanelNodeComponent } from '../user-panel-node/user-panel-node.component';
import { WorkflowNodeComponent } from '../workflow-node/workflow-node.component';
import { DIAGRAM_EDGES, DIAGRAM_NODES } from './diagram-data.config';

@Component({
  selector: 'diagram',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  styleUrls: ['diagram.component.scss', 'tokens.scss'],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        data-no-pan="true"
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
      <div></div>
    </div>
  `,
})
export class DiagramComponent {
  readonly nodeTemplateMap = new NgDiagramNodeTemplateMap([
    ['workflow', WorkflowNodeComponent],
    ['group', GroupNodeComponent],
    ['userPanel', UserPanelNodeComponent],
    ['graph', GraphNodeComponent],
  ]);

  readonly config: NgDiagramConfig = {
    edgeRouting: {
      defaultRouting: 'orthogonal',
    },
    background: {
      dotSpacing: 20,
    },
    resize: {
      allowResizeBelowChildrenBounds: false,
    },
    selectionMoving: {
      edgePanningEnabled: false,
    },
    linking: {
      edgePanningEnabled: false,
    },
    zoom: {
      step: 0, //disable zoom
      zoomToFit: {
        onInit: true,
      },
    },
  };

  readonly model = initializeModel({
    nodes: DIAGRAM_NODES,
    edges: DIAGRAM_EDGES,
  });
}
