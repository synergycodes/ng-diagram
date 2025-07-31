import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  AngularAdapterCustomEdgeComponent,
  AngularAdapterEdgeLabelComponent,
  Edge,
  NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

/**
 * The example below demonstrates how to create a custom edge with:
 * - an interactive button placed on the edge,
 * - dynamic line color customization,
 * - and a customizable markerEnd (arrowhead).
 *
 */

@Component({
  selector: 'app-button-edge',
  templateUrl: './button-edge.component.html',
  styleUrls: ['./button-edge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterCustomEdgeComponent, AngularAdapterEdgeLabelComponent],
})
export class ButtonEdgeComponent implements NgDiagramEdgeTemplate {
  data = input.required<Edge>();

  onButtonClick() {
    console.log('onClick');
  }
}
