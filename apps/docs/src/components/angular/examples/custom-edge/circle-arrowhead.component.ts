import { Component } from '@angular/core';

@Component({
  selector: 'circle-arrowhead',
  template: `
    <svg height="0" width="0">
      <defs>
        <marker
          id="circle-arrowhead"
          markerWidth="8"
          markerHeight="8"
          refX="1"
          refY="4"
          orient="auto"
        >
          <circle cx="4" cy="4" r="3" fill="red" />
        </marker>
      </defs>
    </svg>
  `,
})
export class CircleArrowheadComponent {}
