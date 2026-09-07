import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, NgDiagramEdgeTemplate } from 'ng-diagram';

/**
 * Edge whose label is hidden via the `[hidden]` label input. The label stays
 * mounted but never measures, so it does not block initialization. Unhide it
 * by setting `data.labelHidden` to false on the edge.
 */
@Component({
  selector: 'app-hidden-label-edge',
  templateUrl: './hidden-label-edge.component.html',
  styleUrls: ['./hidden-label-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
})
export class HiddenLabelEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge<HiddenLabelEdgeData>>();

  labelHidden = computed(() => this.edge().data.labelHidden ?? true);
}

interface HiddenLabelEdgeData {
  labelHidden?: boolean;
}
