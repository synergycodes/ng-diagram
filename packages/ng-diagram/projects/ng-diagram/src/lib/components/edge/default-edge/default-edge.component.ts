import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Edge } from '../../../../core/src';
import { NgDiagramEdgeTemplate } from '../../../types';
import { BaseEdgeLabelComponent } from '../../edge-label/base-edge-label.component';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';

@Component({
  selector: 'ng-diagram-default-edge',
  templateUrl: './default-edge.component.html',
  styleUrls: ['./default-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class NgDiagramDefaultEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
}
