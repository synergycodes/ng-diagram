import '@angular/compiler';

import { Component, inject, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramService,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import { filter, skip, take } from 'rxjs';

@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <ng-diagram [model]="model" [config]="config" />
    <div class="toolbar">
      <button (click)="onTestTransactionClick()">
        Create diagram (Transaction)
      </button>
      <button (click)="onTestWithoutTransactionClick()">
        Create diagram (Without Transaction)
      </button>
    </div>
  `,
  styles: `
    :host {
      flex: 1;
      display: flex;
      height: 100%;
      position: relative;
    }

    .toolbar {
      position: absolute;
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem;
      justify-content: center;
      width: 100%;
    }
  `,
})
export class NgDiagramComponentContainer {
  private ngDiagramService = inject(NgDiagramService);
  private modelService = inject(NgDiagramModelService);
  private injector = inject(Injector);

  private initialModel = {
    metadata: { viewport: { x: 130, y: 25, scale: 1 } },
  };

  config: NgDiagramConfig = {
    debugMode: true,
  };

  model = initializeModel({
    ...this.initialModel,
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 200 },
        data: { label: 'Use Buttons to test transaction' },
      },
    ],
  });

  onTestTransactionClick() {
    this.initializeAndCreateDiagram(true);
  }

  onTestWithoutTransactionClick() {
    this.initializeAndCreateDiagram(false);
  }

  private initializeAndCreateDiagram(useTransaction: boolean) {
    this.model = initializeModel(this.initialModel, this.injector);

    // Wait for initialization and then create diagram
    toObservable(this.ngDiagramService.isInitialized, {
      injector: this.injector,
    })
      .pipe(
        filter((initialized) => initialized),
        skip(1), // Skip the initial value (might already be true)
        take(1) // Take only the next emission when it becomes true
      )
      .subscribe(() => {
        if (useTransaction) {
          this.ngDiagramService.transaction(() => {
            this.createTransactionDiagram();
          });
        } else {
          this.createNonTransactionDiagram();
        }
      });
  }

  private createTransactionDiagram() {
    // Transaction example: All operations are batched together
    this.modelService.addNodes([
      {
        id: '1',
        position: { x: 100, y: 100 },
        data: { label: 'Transaction Node 1' },
      },
      {
        id: '2',
        position: { x: 100, y: 200 },
        data: { label: 'Transaction Node 2' },
      },
      {
        id: '3',
        position: { x: 100, y: 300 },
        data: { label: 'Transaction Node 3' },
      },
    ]);

    // Update node data within the same transaction
    this.modelService.updateNodeData('1', {
      label: 'Updated Transaction Node 1',
    });
    this.modelService.updateNodeData('2', {
      label: 'Updated Transaction Node 2',
    });
    this.modelService.updateNodeData('3', {
      label: 'Updated Transaction Node 3',
    });
  }

  private createNonTransactionDiagram() {
    // Non-transaction example: Operations are applied individually
    this.modelService.addNodes([
      {
        id: '1',
        position: { x: 100, y: 100 },
        data: { label: 'Non-Transaction Node 1' },
      },
      {
        id: '2',
        position: { x: 100, y: 200 },
        data: { label: 'Non-Transaction Node 2' },
      },
      {
        id: '3',
        position: { x: 100, y: 300 },
        data: { label: 'Non-Transaction Node 3' },
      },
    ]);

    // Update node data individually (not batched)
    this.modelService.updateNodeData('1', {
      label: 'Updated Non-Transaction Node 1',
    });
    this.modelService.updateNodeData('2', {
      label: 'Updated Non-Transaction Node 2',
    });
    this.modelService.updateNodeData('3', {
      label: 'Updated Non-Transaction Node 3',
    });
  }
}
