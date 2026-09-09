import '@angular/compiler';

import { Component, inject, signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramNodeTemplateMap,
  NgDiagramViewportService,
  provideNgDiagram,
  type EdgeDrawEndedEvent,
  type NgDiagramConfig,
  type SelectionRemovedEvent,
} from 'ng-diagram';
import { diagramModel } from './data';
import { LayoutService } from './layout.service';
import { NodeComponent } from './node/node.component';
import { NodeTemplateType } from './types';

/**
 * Expand/Collapse Subtree Example
 *
 * Demonstrates a collapsible tree layout using ng-diagram with ELK.js for
 * automatic node positioning. Nodes with children display a toggle button to
 * expand/collapse their subtree — collapsing sets the model-level `hidden`
 * flag on the subtree's nodes, and the edges leading into them disappear
 * automatically. Whether a node has children is derived from its edges, so
 * drawing or deleting edges only calls for a re-layout.
 */
@Component({
  selector: 'expand-collapse-diagram-example',
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  template: `
    <div class="not-content diagram" [class.ready]="isLayoutReady()">
      <ng-diagram
        [model]="model"
        [config]="config"
        [nodeTemplateMap]="nodeTemplateMap"
        (edgeDrawEnded)="onEdgeDrawEnded($event)"
        (selectionRemoved)="onSelectionRemoved($event)"
        (diagramInit)="onDiagramInit()"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
  providers: [provideNgDiagram(), LayoutService],
})
export class DiagramComponent {
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly layoutService = inject(LayoutService);

  protected isLayoutReady = signal(false);

  nodeTemplateMap = new NgDiagramNodeTemplateMap([
    [NodeTemplateType.TreeNode, NodeComponent],
  ]);

  model = initializeModel(diagramModel);

  config: NgDiagramConfig = {
    resize: {
      defaultResizable: false,
    },
    nodeRotation: {
      defaultRotatable: false,
    },
  };

  /**
   * A drawn edge changes the tree structure, so the visible nodes are laid
   * out again. The event fires after the edge is committed to the model.
   */
  async onEdgeDrawEnded(event: EdgeDrawEndedEvent): Promise<void> {
    if (!event.success) return;

    await this.layoutService.applyLayout();
  }

  /**
   * Deleted edges change the tree structure, so the visible nodes are laid
   * out again. The event fires after the removal is committed to the model.
   */
  async onSelectionRemoved(event: SelectionRemovedEvent): Promise<void> {
    if (event.deletedEdges.length === 0) return;

    await this.layoutService.applyLayout();
  }

  /**
   * Hide the subtrees flagged as collapsed, run the ELK tree layout, then
   * fit the viewport to show all visible nodes.
   */
  async onDiagramInit(): Promise<void> {
    await this.layoutService.applyInitialLayout();
    await this.viewportService.zoomToFit();
    this.isLayoutReady.set(true);
  }
}
