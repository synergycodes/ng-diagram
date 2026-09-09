import '@angular/compiler';

import { Component } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramNodeTemplateMap,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { diagramModel } from './data';
import { CollapsibleGroupNodeComponent } from './node/collapsible-group-node/collapsible-group-node.component';
import { SimpleNodeComponent } from './node/simple-node/simple-node.component';
import { NodeTemplateType } from './types';

/**
 * Expand/Collapse Groups Example
 *
 * Demonstrates collapsible groups: collapsing a group hides its members with
 * the model-level `hidden` flag and shrinks the group to a header bar, while
 * edges crossing the group boundary are rerouted to the group so external
 * connections stay visible. Nested groups keep their own collapsed state.
 */
@Component({
  selector: 'expand-collapse-groups-example',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  template: `
    <div class="not-content diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
  providers: [provideNgDiagram()],
})
export class DiagramComponent {
  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.SimpleNode, SimpleNodeComponent],
    [NodeTemplateType.CollapsibleGroupNode, CollapsibleGroupNodeComponent],
  ]);

  model = initializeModel(diagramModel);

  config: NgDiagramConfig = {
    zoom: {
      zoomToFit: {
        onInit: true,
      },
    },
    resize: {
      defaultResizable: false,
      allowResizeBelowChildrenBounds: false,
    },
    nodeRotation: {
      defaultRotatable: false,
    },
  };
}
