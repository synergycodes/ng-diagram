import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';
import {
  BaseEdgeLabelComponent,
  Edge,
  NgDiagramBaseEdgeComponent,
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
  encapsulation: ViewEncapsulation.None,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class ButtonEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  selected = computed(() => this.edge().selected);

  onButtonClick() {
    console.log('onClick');
  }
}
