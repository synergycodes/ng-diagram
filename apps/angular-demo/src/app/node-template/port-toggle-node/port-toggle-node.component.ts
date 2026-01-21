import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NgDiagramNodeSelectedDirective, NgDiagramNodeTemplate, NgDiagramPortComponent, Node } from 'ng-diagram';

@Component({
  selector: 'app-port-toggle-node',
  imports: [NgDiagramPortComponent],
  templateUrl: './port-toggle-node.component.html',
  styleUrls: ['./port-toggle-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: {
    '[class.ng-diagram-port-hoverable]': 'true',
  },
})
export class PortToggleNodeComponent implements NgDiagramNodeTemplate<{ text: string }> {
  node = input.required<Node<{ text: string }>>();

  showPorts = signal(true);

  togglePorts(): void {
    this.showPorts.update((v) => !v);
  }
}
