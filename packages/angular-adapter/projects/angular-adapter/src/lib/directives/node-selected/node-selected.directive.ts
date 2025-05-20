import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterNodeSelected]',
  host: {
    '[style.transition]': '"box-shadow 0.1s ease-in-out"',
    '[style.box-shadow]': 'selected() ? "0 0 2px 4px rgba(30, 144, 255, 0.5)" : "none"',
  },
})
export class NodeSelectedDirective {
  data = input.required<Node>();
  selected = computed(() => this.data().selected ?? false);
}
