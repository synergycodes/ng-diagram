import '@angular/compiler';
import { Component } from '@angular/core';
import {
  configureShortcuts,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  NgDiagramViewportService,
  type NgDiagramConfig,
} from 'ng-diagram';
import { ShortcutButtonsComponent } from './shortcut-buttons/shortcut-buttons.component';

@Component({
  selector: 'shortcut-manager-example',
  imports: [
    NgDiagramComponent,
    NgDiagramBackgroundComponent,
    ShortcutButtonsComponent,
  ],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
    </div>
    <shortcut-buttons />
  `,
  styleUrl: './diagram.component.scss',
  providers: [NgDiagramViewportService],
})
export class DiagramComponent {
  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: 100,
      },
    },
    shortcuts: configureShortcuts([
      // Custom keyboard shortcuts for moving selection
      {
        actionName: 'keyboardMoveSelectionUp',
        bindings: [{ key: 'w' }, { key: 'ArrowUp' }],
      },
      {
        actionName: 'keyboardMoveSelectionDown',
        bindings: [{ key: 's' }, { key: 'ArrowDown' }],
      },
      {
        actionName: 'keyboardMoveSelectionLeft',
        bindings: [{ key: 'a' }, { key: 'ArrowLeft' }],
      },
      {
        actionName: 'keyboardMoveSelectionRight',
        bindings: [{ key: 'd' }, { key: 'ArrowRight' }],
      },
    ]),
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 100 },
        data: {
          label: 'Node 1',
        },
      },
      {
        id: '2',
        position: { x: 400, y: 100 },
        data: {
          label: 'Node 2',
        },
      },
      {
        id: '3',
        position: { x: 250, y: 300 },
        data: {
          label: 'Node 3',
        },
      },
    ],
  });
}
