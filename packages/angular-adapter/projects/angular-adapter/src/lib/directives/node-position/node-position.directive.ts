import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterNodePosition]',
  host: {
    '[style.transform]': '`translate(${position().x}px, ${position().y}px)`',
  },
})
export class NodePositionDirective {
  data = input.required<Node>();
  position = computed(() => this.data().position);
}
