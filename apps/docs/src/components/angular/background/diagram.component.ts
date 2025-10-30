import '@angular/compiler';

import { Component, signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramBackgroundComponent,
  NgDiagramComponent,
  provideNgDiagram,
  type NgDiagramConfig,
} from 'ng-diagram';
import {
  SidebarContainer,
  type BackgroundStyle,
} from './sidebar/sidebar.component';

@Component({
  imports: [NgDiagramComponent, SidebarContainer, NgDiagramBackgroundComponent],
  providers: [provideNgDiagram()],
  template: `
    <div class="not-content diagram">
      <ng-diagram [model]="model" [config]="config">
        @if (backgroundStyle() === 'dot') {
          <ng-diagram-background />
        } @else if (backgroundStyle() === 'grid') {
          <ng-diagram-background type="grid" />
        } @else if (backgroundStyle() === 'custom') {
          <ng-diagram-background>
            <svg width="100%" height="100%" style="display:block">
              <defs>
                <pattern
                  id="pattern-diagram-bg"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="40" height="40" fill="#f8fafc" />
                  <circle cx="10" cy="10" r="2.5" fill="#c7e3ff" />
                  <circle cx="30" cy="30" r="2.5" fill="#d6f5d6" />
                  <path
                    d="M0 40 L40 0"
                    stroke="#e6eef8"
                    stroke-width="1"
                    opacity="0.6"
                  />
                  <path
                    d="M-10 10 L10 -10 M30 50 L50 30"
                    stroke="#eef6ef"
                    stroke-width="0.6"
                    opacity="0.5"
                  />
                </pattern>
              </defs>

              <rect
                width="100%"
                height="100%"
                fill="url(#pattern-diagram-bg)"
              />
            </svg>
          </ng-diagram-background>
        }
      </ng-diagram>
    </div>
    <sidebar-container
      [backgroundStyle]="backgroundStyle()"
      (backgroundStyleChange)="onBackgroundStyleChange($event)"
    />
  `,
  styleUrls: ['./diagram.component.scss'],
})
export class DiagramComponent {
  backgroundStyle = signal<BackgroundStyle>('dot');

  onBackgroundStyleChange(style: BackgroundStyle) {
    this.backgroundStyle.set(style);
  }

  config = {
    zoom: {
      zoomToFit: {
        onInit: true,
        padding: [50, 315, 50, 50],
      },
    },
  } satisfies NgDiagramConfig;

  model = initializeModel({
    nodes: [
      { id: '1', position: { x: 100, y: 150 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 400, y: 150 }, data: { label: 'Node 2' } },
    ],
    edges: [
      {
        id: '1',
        source: '1',
        sourcePort: 'port-right',
        targetPort: 'port-left',
        target: '2',
        data: {},
      },
    ],
  });
}
