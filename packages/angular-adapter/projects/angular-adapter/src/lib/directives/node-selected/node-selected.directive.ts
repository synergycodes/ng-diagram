import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterNodeSelected]',
  host: {
    '[class.ng-diagram-node-selected]': 'selected()',
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class NodeSelectedDirective {
  data = input.required<Node>();
  selected = computed(() => this.data().selected ?? false);
}
