import { Component } from '@angular/core';
import { NgDiagramMarkerComponent } from 'ng-diagram';

@Component({
  selector: 'custom-arrowheads',
  imports: [NgDiagramMarkerComponent],
  template: `
    <!-- @mark-start -->
    <!-- Square Arrowhead for Target -->
    <ng-diagram-marker>
      <svg>
        <defs>
          <marker
            id="square-arrowhead-target"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="10"
            markerHeight="10"
          >
            <rect
              x="1"
              y="1"
              width="8"
              height="8"
              fill="context-stroke"
              stroke="context-stroke"
            />
          </marker>
        </defs>
      </svg>
    </ng-diagram-marker>

    <!-- Square Arrowhead for Source -->
    <!-- refX change to prevent overlap with source node -->
    <ng-diagram-marker>
      <svg>
        <defs>
          <marker
            id="square-arrowhead-source"
            viewBox="0 0 10 10"
            refX="2"
            refY="5"
            markerWidth="10"
            markerHeight="10"
          >
            <rect
              x="1"
              y="1"
              width="8"
              height="8"
              fill="context-stroke"
              stroke="context-stroke"
            />
          </marker>
        </defs>
      </svg>
    </ng-diagram-marker>
    <!-- @mark-end -->

    <!-- @mark-start -->
    <!-- Open Arrow Arrowhead -->
    <ng-diagram-marker>
      <svg>
        <defs>
          <marker
            id="open-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="10"
            markerHeight="10"
          >
            <path
              d="M 2 2 L 8 5 L 2 8"
              fill="none"
              stroke="context-stroke"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </marker>
        </defs>
      </svg>
    </ng-diagram-marker>
    <!-- @mark-end -->

    <!-- @mark-start -->
    <!-- Circle Arrowhead -->
    <ng-diagram-marker>
      <svg>
        <defs>
          <marker
            id="circle-arrowhead"
            viewBox="0 0 8 8"
            refX="6"
            refY="4"
            markerWidth="8"
            markerHeight="8"
          >
            <circle cx="4" cy="4" r="3" fill="context-stroke" />
          </marker>
        </defs>
      </svg>
    </ng-diagram-marker>
    <!-- @mark-end -->
  `,
})
export class CustomArrowheadsComponent {}
