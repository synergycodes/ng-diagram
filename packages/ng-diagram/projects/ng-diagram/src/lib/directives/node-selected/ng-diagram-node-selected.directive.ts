import { computed, Directive, input } from '@angular/core';
import { Node } from '../../../core/src';

@Directive({
  selector: '[ngDiagramNodeSelected]',
  host: {
    '[class.ng-diagram-node-selected]': 'selected()',
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class NgDiagramNodeSelectedDirective {
  node = input.required<Node>();
  selected = computed(() => this.node().selected ?? false);
}
