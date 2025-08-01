import { computed, Directive, input } from '@angular/core';
import { GroupNode } from '@angularflow/core';

@Directive({
  selector: '[ngDiagramGroupHighlighted]',
  host: {
    '[class.ng-diagram-group-highlight]': 'highlighted()',
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class NgDiagramGroupHighlightedDirective {
  data = input.required<GroupNode>();
  highlighted = computed(() => {
    return this.data().highlighted ?? false;
  });
}
