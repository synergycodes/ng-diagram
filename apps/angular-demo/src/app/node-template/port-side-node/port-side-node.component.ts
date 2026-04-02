import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgDiagramNodeSelectedDirective, NgDiagramNodeTemplate, NgDiagramPortComponent, Node } from 'ng-diagram';
import { PortSideService } from '../../services/port-side.service';

@Component({
  selector: 'app-port-side-node',
  imports: [NgDiagramPortComponent],
  templateUrl: './port-side-node.component.html',
  styleUrls: ['./port-side-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class PortSideNodeComponent implements NgDiagramNodeTemplate<{ text: string }> {
  node = input.required<Node<{ text: string }>>();

  private readonly portSideService = inject(PortSideService);

  portSide = this.portSideService.portSide;
  text = computed(() => this.node()?.data?.text || 'Port Side Node');
}
