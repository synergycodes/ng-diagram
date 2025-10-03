import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { Edge } from '../../../../core/src';
import { NgDiagramEdgeTemplate } from '../../../types';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';

@Component({
  selector: 'ng-diagram-default-edge',
  standalone: true,
  templateUrl: './default-edge.component.html',
  styleUrls: ['./default-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent],
  encapsulation: ViewEncapsulation.None,
})
export class NgDiagramDefaultEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
}
