import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgDiagramPortComponent, type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

export interface HiddenPortsNodeData {
  label: string;
  portsHidden?: boolean;
}

/** Ports stay mounted; `data.portsHidden` drives the declarative `[hidden]` port input so a node can start with hidden ports. */
@Component({
  selector: 'harness-hidden-ports-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramPortComponent],
  template: `
    <div class="hidden-ports-node">{{ label() }}</div>
    <ng-diagram-port id="port-left" type="both" side="left" [hidden]="portsHidden()" />
    <ng-diagram-port id="port-right" type="both" side="right" [hidden]="portsHidden()" />
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .hidden-ports-node {
        box-sizing: border-box;
        background: #fff;
        border: 1px solid #ccc;
        padding: 8px;
      }
    `,
  ],
})
export class HiddenPortsNodeComponent implements NgDiagramNodeTemplate<HiddenPortsNodeData> {
  node = input.required<Node<HiddenPortsNodeData>>();

  readonly label = computed(() => this.node().data?.label ?? '');
  readonly portsHidden = computed(() => this.node().data?.portsHidden === true);
}
