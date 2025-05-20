import { computed, Directive, input } from '@angular/core';
import { Edge, Node } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterZIndex]',
  host: {
    '[style.z-index]': 'zIndex()',
  },
})
export class ZIndexDirective {
  data = input.required<Node | Edge>();
  zIndex = computed(() => this.data().zIndex ?? 0);
}
