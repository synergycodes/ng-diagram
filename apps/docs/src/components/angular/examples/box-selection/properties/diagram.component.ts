// @section-start
import '@angular/compiler';

import { Component, inject } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramService,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  imports: [NgDiagramComponent, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="toolbar">
      <div class="option">
        <label for="partialInclusion">Partial Inclusion</label>
        <input
          id="partialInclusion"
          type="checkbox"
          [checked]="partialInclusion"
          (change)="togglePartialInclusion()"
        />
      </div>
      <div class="option">
        <label for="realtime">Realtime</label>
        <input
          id="realtime"
          type="checkbox"
          [checked]="realtime"
          (change)="toggleRealtime()"
        />
      </div>
    </div>
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        position: relative;
      }

      .diagram {
        display: flex;
        width: 100%;
        height: var(--ng-diagram-height);
        border: var(--ng-diagram-border);
      }

      .toolbar {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        padding: 0.5rem;
        margin-top: 1rem;
        flex-direction: column;
        align-items: end;
        background-color: var(--ngd-node-bg-primary-default);
        border: var(--ng-diagram-border);
        z-index: 1;

        button {
          margin-top: 0;
        }
      }

      .option {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    `,
  ],
})
export class DiagramComponent {
  private readonly diagramService = inject(NgDiagramService);
  partialInclusion = true;
  realtime = true;

  togglePartialInclusion(): void {
    this.partialInclusion = !this.partialInclusion;
    this.diagramService.updateConfig({
      boxSelection: {
        partialInclusion: this.partialInclusion,
      },
    });
  }

  toggleRealtime(): void {
    this.realtime = !this.realtime;
    this.diagramService.updateConfig({
      boxSelection: {
        realtime: this.realtime,
      },
    });
  }

  config = {
    // @section-start:config
    boxSelection: {
      partialInclusion: true,
      realtime: true,
    },
    // @section-end:config
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 180,
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: {
          x: 0,
          y: 0,
        },
        data: { label: 'Node 1' },
      },
      {
        id: '2',
        position: {
          x: 300,
          y: 0,
        },
        data: { label: 'Node 2' },
      },
    ],
  });
}
