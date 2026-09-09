import '@angular/compiler';

import { Component, inject, signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramNodeTemplateMap,
  NgDiagramService,
  NgDiagramViewportService,
  provideNgDiagram,
  type DiagramInitEvent,
  type EdgeDrawEndedEvent,
  type NgDiagramConfig,
  type SelectionRemovedEvent,
} from 'ng-diagram';
import { diagramModel } from './data';
import { LayoutService } from './layout.service';
import { NodeComponent } from './node/node.component';
import { NodeTemplateType, type TreeNodeData } from './types';

/**
 * Expand/Collapse Subtree Example
 *
 * Demonstrates a collapsible tree layout using ng-diagram with ELK.js for
 * automatic node positioning. Nodes with children display a toggle button to
 * expand/collapse their subtree — collapsing sets the model-level `hidden`
 * flag on the subtree's nodes, and the edges leading into them disappear
 * automatically. The `hasChildren` flag on each node is kept in sync as the
 * user draws or deletes edges.
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
        (diagramInit)="onDiagramInit($event)"
      >
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styleUrl: './diagram.component.scss',
  providers: [provideNgDiagram(), LayoutService],
})
export class DiagramComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
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
   * When the user draws a new edge, mark the source node as having children
   * so the expand/collapse toggle button appears. Re-layout only if the
   * flag actually changed.
   */
  async onEdgeDrawEnded(event: EdgeDrawEndedEvent): Promise<void> {
    if (!event.success) return;

    const sourceData = event.source.data as TreeNodeData;
    if (!sourceData.hasChildren) {
      // Await the transaction to ensure hasChildren is committed
      // to the model before re-layout reads it.
      await this.diagramService.transaction(async () => {
        this.modelService.updateNodeData<TreeNodeData>(event.source.id, {
          ...sourceData,
          hasChildren: true,
        });
      });

      await this.layoutService.applyLayout();
    }
  }

  /**
   * When the user deletes edges, check whether each affected source node
   * still has outgoing edges. If not, clear `hasChildren` so the toggle
   * button is removed. Re-layout only if at least one node was updated.
   */
  async onSelectionRemoved(event: SelectionRemovedEvent): Promise<void> {
    if (event.deletedEdges.length === 0) return;

    const affectedSourceIds = new Set(event.deletedEdges.map((e) => e.source));
    let changed = false;

    // Await the transaction to ensure hasChildren updates are committed
    // to the model before re-layout reads them.
    await this.diagramService.transaction(async () => {
      for (const sourceId of affectedSourceIds) {
        const stillHasChildren = this.modelService
          .getConnectedEdges(sourceId)
          .some((e) => e.source === sourceId);
        if (stillHasChildren) continue;

        const node = this.modelService.getNodeById<TreeNodeData>(sourceId);
        if (node?.data.hasChildren) {
          this.modelService.updateNodeData<TreeNodeData>(sourceId, {
            ...node.data,
            hasChildren: false,
          });
          changed = true;
        }
      }
    });

    if (changed) {
      await this.layoutService.applyLayout();
    }
  }

  /**
   * Run the ELK tree layout inside a transaction (so measurements are
   * up-to-date), then fit the viewport to show all nodes.
   */
  async onDiagramInit(_: DiagramInitEvent): Promise<void> {
    await this.diagramService.transaction(
      async () => {
        await this.layoutService.applyLayout();
      },
      { waitForMeasurements: true }
    );

    await this.viewportService.zoomToFit();
    this.isLayoutReady.set(true);
  }
}
