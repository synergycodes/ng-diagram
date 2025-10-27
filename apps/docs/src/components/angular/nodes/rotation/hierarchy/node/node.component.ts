// @collapse-start
import { Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
// @collapse-end

@Component({
  imports: [NgDiagramNodeRotateAdornmentComponent],
  template: `
    <ng-diagram-node-rotate-adornment [defaultRotatable]="defaultRotatable()" />
    <div class="custom-node">
      <div class="custom-node__header">Custom node</div>
    </div>
  `,
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  styleUrls: ['./node.component.scss'],
})
export class CustomNodeComponent implements NgDiagramNodeTemplate {
  node = input.required<Node<{ adornmentRotatable?: boolean }>>();
  defaultRotatable = computed(() => this.node().data['adornmentRotatable']);
}
