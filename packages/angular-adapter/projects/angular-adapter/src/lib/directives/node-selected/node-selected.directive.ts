import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterNodeSelected]',
  host: {
    '[style.transition]': '!selected() ? "box-shadow 0.1s ease-in-out" : null',
    '[style.box-shadow]': 'selected() ? "var(--ngd-selected-node-box-shadow)" : null',
  },
})
export class NodeSelectedDirective {
  data = input.required<Node>();
  selected = computed(() => this.data().selected ?? false);
}
