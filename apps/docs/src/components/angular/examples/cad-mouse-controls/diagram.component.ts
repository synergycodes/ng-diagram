import '@angular/compiler';

import { Component } from '@angular/core';
import {
  configureShortcuts,
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type Edge,
  type Node,
  type NgDiagramConfig,
} from 'ng-diagram';
import { DirectionalBoxSelectionDirective } from './directional-box-selection.directive';
import { MiddleMousePanDirective } from './middle-mouse-pan.directive';

@Component({
  imports: [
    NgDiagramComponent,
    NgDiagramBackgroundComponent,
    DirectionalBoxSelectionDirective,
    MiddleMousePanDirective,
  ],
  providers: [provideNgDiagram()],
  template: `
    <div
      class="not-content diagram"
      directionalBoxSelection
      #boxSelection="directionalBoxSelection"
      middleMousePan
    >
      <ul class="legend" aria-label="Mouse controls">
        <li><span class="input">Middle drag</span> Pan</li>
        <li><span class="input">Wheel</span> Zoom</li>
        <li [class.active]="boxSelection.mode() === 'window'">
          <span class="input">Drag left → right</span>
          <span class="swatch window"></span> Window
        </li>
        <li [class.active]="boxSelection.mode() === 'crossing'">
          <span class="input">Drag right → left</span>
          <span class="swatch crossing"></span> Crossing
        </li>
      </ul>
      <ng-diagram [model]="model" [config]="config">
        <ng-diagram-background />
      </ng-diagram>
      @if (boxSelection.box(); as box) {
        <div
          class="selection-box"
          [style.left.px]="box.x"
          [style.top.px]="box.y"
          [style.width.px]="box.width"
          [style.height.px]="box.height"
        ></div>
      }
    </div>
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  config = {
    zoom: {
      // Each wheel event zooms by one step. A mouse wheel sends one event per notch,
      // so a bigger step than the default gives a clear zoom for each notch.
      step: 0.1,
      zoomToFit: {
        onInit: true,
        padding: [120, 60],
      },
    },
    shortcuts: configureShortcuts([
      // The wheel zooms without a modifier; Ctrl/Cmd + wheel keeps working
      {
        actionName: 'zoom',
        bindings: [{ modifiers: {} }, { modifiers: { primary: true } }],
      },
    ]),
    // The built-in box selection still runs on touch devices (long press).
    // It selects as a window, to match the blue color of its box.
    boxSelection: {
      partialInclusion: false,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      device('supply', 'Power Supply', 0, 0),
      device('controller', 'Controller', 300, 0),
      device('switch', 'Network Switch', 600, 0),
      device('server', 'Server', 900, 0),
      device('sensor-a', 'Sensor A', 0, 220),
      device('sensor-b', 'Sensor B', 300, 220),
      device('display', 'Display', 600, 220),
      device('backup', 'Backup', 900, 220),
    ],
    edges: [
      connect('supply', 'controller'),
      connect('controller', 'switch'),
      connect('switch', 'server'),
      connect('sensor-a', 'sensor-b'),
      connect('switch', 'display'),
      connect('display', 'backup'),
    ],
  });
}

function device(id: string, label: string, x: number, y: number): Node {
  return { id, position: { x, y }, data: { label } };
}

function connect(source: string, target: string): Edge {
  return {
    id: `${source}-${target}`,
    source,
    sourcePort: 'port-right',
    target,
    targetPort: 'port-left',
    targetArrowhead: 'ng-diagram-arrow',
    data: {},
  };
}
