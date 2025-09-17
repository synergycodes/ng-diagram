import { computed, Directive, input } from '@angular/core';
import { GroupNode } from '@ng-diagram/core';

@Directive({
  selector: '[ngDiagramGroupHighlighted]',
  host: {
    '[class.ng-diagram-group-highlight]': 'highlighted()',
    '[class.ng-diagram-node-wrapper]': 'true',
  },
})
export class NgDiagramGroupHighlightedDirective {
  node = input.required<GroupNode>();
  highlighted = computed(() => {
    return this.node().highlighted ?? false;
  });
}
