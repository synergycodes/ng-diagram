import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramEdgeTemplate } from 'ng-diagram';

@Component({
  selector: 'app-dashed-edge',
  template: `<ng-diagram-base-edge [edge]="edge()" class="dashed-edge" />`,
  styleUrls: ['./dashed-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent],
})
export class DashedEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
}
