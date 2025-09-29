import { computed, Directive, input } from '@angular/core';
import { Node } from '../../../core/src';

@Directive({
  selector: '[ngDiagramNodePosition]',
  standalone: true,
  host: {
    '[style.transform]': 'transform',
    '[style.transform-origin]': '"0 0"',
  },
})
export class NodePositionDirective {
  node = input.required<Node>();
  position = computed(() => this.node().position);

  get transform(): string {
    const pos = this.position();
    return `translate(${pos.x}px, ${pos.y}px)`;
  }
}
