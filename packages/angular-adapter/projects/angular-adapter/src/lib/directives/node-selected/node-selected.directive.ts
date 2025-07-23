import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterNodeSelected]',
  host: {
    '[style.transition]': '!selected() ? "box-shadow 0.1s ease-in-out, outline 0.1s ease-in-out" : "none"',
    '[style.box-shadow]': 'selected() ? "var(--ngd-selected-node-box-shadow)" : "none"',
    '[style.outline]': 'selected() ? "var(--ngd-selected-node-outline)" : "none"',
  },
})
export class NodeSelectedDirective {
  data = input.required<Node>();
  selected = computed(() => this.data().selected ?? false);
}
