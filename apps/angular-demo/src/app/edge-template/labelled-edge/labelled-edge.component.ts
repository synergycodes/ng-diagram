import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { BaseEdgeLabelComponent, Edge, NgDiagramBaseEdgeComponent, NgDiagramEdgeTemplate } from 'ng-diagram';

/**
 * Simple edge with a single label at the center.
 * Uses default routing (no routing specified).
 */

@Component({
  selector: 'app-labelled-edge',
  standalone: true,
  templateUrl: './labelled-edge.component.html',
  styleUrls: ['./labelled-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class LabelledEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge<Data>>();

  selected = computed(() => this.edge().selected);
}

interface Data {
  labelPosition?: number;
}
