import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgDiagramPortComponent, type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

/** A node with ports on its top and bottom sides, for edges that end vertically. */
@Component({
  selector: 'harness-vertical-ports-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramPortComponent],
  template: `
    <div class="vertical-ports-node">{{ label() }}</div>
    <ng-diagram-port id="port-top" type="both" side="top" />
    <ng-diagram-port id="port-bottom" type="both" side="bottom" />
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .vertical-ports-node {
        box-sizing: border-box;
        background: #fff;
        border: 1px solid #ccc;
        padding: 8px;
      }
    `,
  ],
})
export class VerticalPortsNodeComponent implements NgDiagramNodeTemplate<{ label: string }> {
  node = input.required<Node<{ label: string }>>();

  readonly label = computed(() => this.node().data?.label ?? '');
}
