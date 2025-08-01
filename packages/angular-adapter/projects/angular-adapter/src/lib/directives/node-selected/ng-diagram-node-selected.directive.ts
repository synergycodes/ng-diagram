import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[ngDiagramNodeSelected]',
  host: {
    '[class.ng-diagram-node-selected]': 'selected()',
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class NgDiagramNodeSelectedDirective {
  data = input.required<Node>();
  selected = computed(() => this.data().selected ?? false);
}
