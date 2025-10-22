import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, NgDiagramEdgeTemplate } from 'ng-diagram';

/**
 * Simple edge with a single label at the center.
 * Uses default routing (no routing specified).
 */

@Component({
  selector: 'app-labelled-edge',
  templateUrl: './labelled-edge.component.html',
  styleUrls: ['./labelled-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
})
export class LabelledEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge<Data>>();

  selected = computed(() => this.edge().selected);
}

interface Data {
  labelPosition?: number;
}
