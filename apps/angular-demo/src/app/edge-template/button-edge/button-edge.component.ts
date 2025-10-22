import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge, NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, NgDiagramEdgeTemplate } from 'ng-diagram';

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
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
})
export class ButtonEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  selected = computed(() => this.edge().selected);

  onButtonClick() {
    console.log('onClick');
  }
}
