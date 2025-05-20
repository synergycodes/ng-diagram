import { Directive, input } from '@angular/core';
import { Viewport } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterViewport]',
  host: {
    '[style.transform]': '`translate(${viewport().x}px, ${viewport().y}px) scale(${viewport().scale})`',
  },
})
export class ViewportDirective {
  viewport = input<Viewport>({ x: 0, y: 0, scale: 1 });
}
