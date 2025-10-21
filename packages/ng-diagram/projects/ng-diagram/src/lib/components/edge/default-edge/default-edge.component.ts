import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import { Edge } from '../../../../core/src';
import { NgDiagramEdgeTemplate } from '../../../types';
import { BaseEdgeLabelComponent } from '../../edge-label/base-edge-label/base-edge-label.component';
import { DefaultEdgeLabelComponent } from '../../edge-label/default-edge-label/default-edge-label.component';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';

@Component({
  selector: 'ng-diagram-default-edge',
  standalone: true,
  templateUrl: './default-edge.component.html',
  styleUrls: ['./default-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent, DefaultEdgeLabelComponent],
  encapsulation: ViewEncapsulation.None,
})
export class NgDiagramDefaultEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge<{ label?: string }>>();

  label = computed(() => this.edge().data?.label);
}
