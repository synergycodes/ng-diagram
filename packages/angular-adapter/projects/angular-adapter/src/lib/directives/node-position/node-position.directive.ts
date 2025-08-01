import { computed, Directive, input } from '@angular/core';
import { Node } from '@angularflow/core';

@Directive({
  selector: '[ngDiagramNodePosition]',
  host: {
    '[style.transform]': '`translate(${position().x}px, ${position().y}px)`',
    '[style.transform-origin]': '"0 0"',
  },
})
export class NodePositionDirective {
  data = input.required<Node>();
  position = computed(() => this.data().position);
}
