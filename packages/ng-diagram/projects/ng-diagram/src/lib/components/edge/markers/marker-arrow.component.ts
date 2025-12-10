import { Component } from '@angular/core';
import { NgDiagramMarkerComponent } from '../../marker/ng-diagram-marker.component';

/**
 * Default arrow marker component.
 * Renders the built-in arrow marker using NgDiagramMarkerComponent.
 */
@Component({
  selector: 'ng-diagram-marker-arrow',
  standalone: true,
  imports: [NgDiagramMarkerComponent],
  template: `
    <ng-diagram-marker>
      <svg>
        <defs>
          <marker
            id="ng-diagram-arrow"
            viewBox="0 9 8 14"
            refX="6"
            refY="16"
            markerWidth="4"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path
              d="M1 21L6 16L1 11"
              stroke="context-stroke"
              fill="none"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </marker>
        </defs>
      </svg>
    </ng-diagram-marker>
  `,
})
export class NgDiagramMarkerArrowComponent {}
