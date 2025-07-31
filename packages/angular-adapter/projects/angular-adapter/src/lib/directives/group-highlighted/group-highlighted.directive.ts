import { computed, Directive, input } from '@angular/core';
import { GroupNode } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterGroupHighlighted]',
  host: {
    '[class.highlighted]': 'highlighted()',
  },
})
export class GroupHighlightedDirective {
  data = input.required<GroupNode>();
  highlighted = computed(() => {
    return this.data().highlighted ?? false;
  });
}
