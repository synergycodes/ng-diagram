import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge } from '../../../../core/src';
import { NgDiagramEdgeTemplate } from '../../../types';
import { NgDiagramBaseEdgeLabelComponent } from '../../edge-label/base-edge-label/base-edge-label.component';
import { DefaultEdgeLabelComponent } from '../../edge-label/default-edge-label/default-edge-label.component';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';

@Component({
  selector: 'ng-diagram-default-edge',
  templateUrl: './default-edge.component.html',
  styleUrls: ['./default-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, DefaultEdgeLabelComponent],
})
export class NgDiagramDefaultEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge<{ label?: string }>>();

  label = computed(() => this.edge().data?.label);
}
