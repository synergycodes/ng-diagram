import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { NgDiagramNodeSelectedDirective, NgDiagramNodeTemplate, NgDiagramPortComponent, Node } from 'ng-diagram';

/**
 * Unlike PortToggleNodeComponent (which unmounts ports with @if), this
 * template keeps the ports mounted and hides them declaratively via the
 * `[hidden]` port input.
 */
@Component({
  selector: 'app-hidden-port-node',
  imports: [NgDiagramPortComponent],
  templateUrl: './hidden-port-node.component.html',
  styleUrls: ['./hidden-port-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: {
    '[class.ng-diagram-port-hoverable]': 'true',
  },
})
export class HiddenPortNodeComponent implements NgDiagramNodeTemplate<{ text: string }> {
  node = input.required<Node<{ text: string }>>();

  portsHidden = signal(false);

  togglePorts(): void {
    this.portsHidden.update((v) => !v);
  }
}
