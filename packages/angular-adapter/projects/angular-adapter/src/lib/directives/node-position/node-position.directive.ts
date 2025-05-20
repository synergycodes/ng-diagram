import { Directive, input } from '@angular/core';

@Directive({
  selector: '[angularAdapterNodePosition]',
  host: {
    '[style.transform]': '`translate(${position().x}px, ${position().y}px)`',
  },
})
export class NodePositionDirective {
  position = input<{ x: number; y: number }>({ x: 0, y: 0 });
}
