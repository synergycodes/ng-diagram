import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { Edge } from '@angularflow/core';
import { NgDiagramEdgeTemplate } from '../../../types';
import { getPath } from '../../../utils/get-path/get-path';
import { BaseEdgeLabelComponent } from '../../edge-label/base-edge-label.component';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';

@Component({
  selector: 'ng-diagram-default-edge',
  templateUrl: './default-edge.component.html',
  styleUrls: ['./default-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
  encapsulation: ViewEncapsulation.None,
})
export class NgDiagramDefaultEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  path = computed(() => {
    const { routing, points } = this.edge();
    return { path: getPath(routing, points || []), points: points || [] };
  });

  markerStart = computed(() => (this.edge().sourceArrowhead ? `url(#${this.edge().sourceArrowhead})` : undefined));
  markerEnd = computed(() => (this.edge().targetArrowhead ? `url(#${this.edge().targetArrowhead})` : undefined));
}
