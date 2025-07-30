import { computed, Directive, input } from '@angular/core';
import { GroupNode } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterNodeHighlighted]',
  host: {
    '[attr.data-highlighted]': 'highlighted()',
  },
})
export class NodeHighlightedDirective {
  data = input.required<GroupNode>();
  highlighted = computed(() => {
    return this.data().highlighted ?? false;
  });
}
