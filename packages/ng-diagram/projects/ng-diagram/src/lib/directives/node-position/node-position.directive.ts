import { computed, Directive, input } from '@angular/core';
import { Node } from '../../../core/src';

@Directive({
  selector: '[ngDiagramNodePosition]',
  host: {
    '[style.transform]': '`translate(${position().x}px, ${position().y}px)`',
    '[style.transform-origin]': '"0 0"',
  },
})
export class NodePositionDirective {
  node = input.required<Node>();
  position = computed(() => this.node().position);
}
