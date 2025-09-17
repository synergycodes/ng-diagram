import { Component } from '@angular/core';

@Component({
  selector: 'custom-arrowheads',
  template: `
    <svg height="0" width="0">
      <defs>
        <!-- Square Arrowhead -->
        <marker
          id="square-arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
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

        <!-- Open Arrow Arrowhead -->
        <marker
          id="open-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
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

        <!-- Circle Arrowhead -->
        <marker
          id="circle-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <circle cx="4" cy="4" r="3" fill="context-stroke" />
        </marker>
      </defs>
    </svg>
  `,
})
export class CustomArrowheadsComponent {}
