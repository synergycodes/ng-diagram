import { Component } from '@angular/core';

@Component({
  selector: 'circle-arrowhead',
  template: `
    <svg height="0" width="0">
      <defs>
        <marker
          id="circle-arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <circle cx="5" cy="5" r="4" fill="red" />
        </marker>
      </defs>
    </svg>
  `,
})
export class CircleArrowheadComponent {}
