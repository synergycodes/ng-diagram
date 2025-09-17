import '@angular/compiler';
import { Component, ElementRef, viewChild, type Signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramModelService,
  type NgDiagramConfig,
} from 'ng-diagram';
import { NavBarComponent } from './nav-bar/nav-bar.component';

@Component({
  selector: 'download-image',
  imports: [NgDiagramComponent, NavBarComponent],
  template: `
    <div>
      <nav-bar [elementRef]="ngDiagram.elementRef"></nav-bar>
      <div class="not-content diagram">
        <ng-diagram #ngDiagram [model]="model" [config]="config" />
      </div>
    </div>
  `,
  styleUrl: './download-image.component.scss',
  providers: [NgDiagramModelService],
})
export class DownloadImageComponent {
  ngDiagram: Signal<ElementRef<HTMLElement> | undefined> =
    viewChild('ngDiagram');

  config = {
    zoom: {
      max: 3,
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      {
        id: 'MAIN ROOT',
        position: { x: 500, y: 50 },
        data: {},
        size: { width: 140, height: 50 },
      },
      {
        id: 'child1',
        position: { x: 250, y: 100 },
        data: {},
        size: { width: 120, height: 44 },
      },
      {
        id: 'child2',
        position: { x: 250, y: 0 },
        data: {},
        size: { width: 120, height: 44 },
      },
      {
        id: 'child3',
        position: { x: 750, y: 0 },
        data: {},
        size: { width: 120, height: 44 },
      },
      {
        id: 'leaf1',
        position: { x: 0, y: 150 },
        data: {},
        size: { width: 100, height: 38 },
      },
      {
        id: 'leaf2',
        position: { x: 0, y: 50 },
        data: {},
        size: { width: 100, height: 38 },
      },
      {
        id: 'leaf3',
        position: { x: 1000, y: 50 },
        data: {},
        size: { width: 100, height: 38 },
      },
      {
        id: 'leaf4',
        position: { x: 1000, y: -50 },
        data: {},
        size: { width: 100, height: 38 },
      },
      {
        id: 'leaf5',
        position: { x: 1000, y: -150 },
        data: {},
        size: { width: 100, height: 38 },
      },
      {
        id: 'leaf6',
        position: { x: 1000, y: 150 },
        data: {},
        size: { width: 100, height: 38 },
      },
    ],
    edges: [
      {
        id: 'e1',
        data: {},
        source: 'MAIN ROOT',
        target: 'child1',
        sourcePort: 'port-left',
        targetPort: 'port-right',
      },
      {
        id: 'e2',
        data: {},
        source: 'MAIN ROOT',
        target: 'child2',
        sourcePort: 'port-left',
        targetPort: 'port-right',
      },
      {
        id: 'e3',
        data: {},
        source: 'MAIN ROOT',
        target: 'child3',
        sourcePort: 'port-right',
        targetPort: 'port-left',
      },
      {
        id: 'e4',
        data: {},
        source: 'child1',
        target: 'leaf1',
        sourcePort: 'port-left',
        targetPort: 'port-right',
      },
      {
        id: 'e5',
        data: {},
        source: 'child1',
        target: 'leaf2',
        sourcePort: 'port-left',
        targetPort: 'port-right',
      },
      {
        id: 'e6',
        data: {},
        source: 'child3',
        target: 'leaf3',
        sourcePort: 'port-right',
        targetPort: 'port-left',
      },
      {
        id: 'e7',
        data: {},
        source: 'child3',
        target: 'leaf4',
        sourcePort: 'port-right',
        targetPort: 'port-left',
      },
      {
        id: 'e8',
        data: {},
        source: 'child3',
        target: 'leaf5',
        sourcePort: 'port-right',
        targetPort: 'port-left',
      },
      {
        id: 'e9',
        data: {},
        source: 'child3',
        target: 'leaf6',
        sourcePort: 'port-right',
        targetPort: 'port-left',
      },
    ],
    metadata: { viewport: { x: -100, y: 100, scale: 0.75 } },
  });
}
