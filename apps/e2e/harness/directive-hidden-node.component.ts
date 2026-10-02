import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgDiagramHiddenDirective, type NgDiagramNodeTemplate, type Node } from 'ng-diagram';

export interface DirectiveHiddenNodeData {
  label: string;
  directiveHidden?: boolean;
}

/**
 * Hides its OWNER node through `[ngDiagramHidden]` placed on an inner element —
 * `data.directiveHidden` drives the binding so tests can toggle it through the model.
 */
@Component({
  selector: 'harness-directive-hidden-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramHiddenDirective],
  template: `<div class="directive-hidden-node" [ngDiagramHidden]="directiveHidden()">{{ label() }}</div>`,
  styles: [
    `
      :host {
        display: block;
      }

      .directive-hidden-node {
        box-sizing: border-box;
        background: #fff;
        border: 1px solid #ccc;
        padding: 8px;
      }
    `,
  ],
})
export class DirectiveHiddenNodeComponent implements NgDiagramNodeTemplate<DirectiveHiddenNodeData> {
  node = input.required<Node<DirectiveHiddenNodeData>>();

  readonly label = computed(() => this.node().data?.label ?? '');
  readonly directiveHidden = computed(() => this.node().data?.directiveHidden === true);
}
