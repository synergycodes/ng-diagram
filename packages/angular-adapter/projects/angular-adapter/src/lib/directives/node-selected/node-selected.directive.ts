import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterNodeSelected]',
  host: {},
})
export class NodeSelectedDirective {
  data = input.required<Node>();
  selected = computed(() => this.data().selected ?? false);
}
