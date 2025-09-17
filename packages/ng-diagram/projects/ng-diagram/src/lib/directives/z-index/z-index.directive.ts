import { computed, Directive, input } from '@angular/core';
import { Edge, Node } from '../../../core/src';

@Directive({
  selector: '[ngDiagramZIndex]',
  host: {
    '[style.z-index]': 'zIndex()',
  },
})
export class ZIndexDirective {
  data = input.required<Node | Edge>();
  zIndex = computed(() => this.data().computedZIndex ?? 0);
}
