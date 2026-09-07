import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
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
export class HiddenPortNodeComponent implements NgDiagramNodeTemplate<HiddenPortNodeData> {
  node = input.required<Node<HiddenPortNodeData>>();

  // Seeded from the model so a node can start with hidden ports — they are
  // declared hidden before registering for measurement, so they never block
  // initialization. The checkbox toggles the local state afterwards.
  portsHidden = linkedSignal(() => this.node().data.portsHidden === true);

  togglePorts(): void {
    this.portsHidden.update((v) => !v);
  }
}

interface HiddenPortNodeData {
  text: string;
  portsHidden?: boolean;
}
