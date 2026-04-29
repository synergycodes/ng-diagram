import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  Node,
  type PortSide,
} from 'ng-diagram';

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

  portSide = signal<PortSide>('bottom');
  oppositePortSide = computed<PortSide>(() => (this.portSide() === 'bottom' ? 'top' : 'left'));
  text = computed(() => this.node()?.data?.text || 'Port Side Node');

  onTogglePortSide(): void {
    this.portSide.update((side) => (side === 'bottom' ? 'right' : 'bottom'));
  }
}
