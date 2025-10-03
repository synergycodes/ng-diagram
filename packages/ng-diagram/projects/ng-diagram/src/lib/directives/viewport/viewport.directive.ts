import { Directive, input } from '@angular/core';
import { Viewport } from '../../../core/src';

@Directive({
  selector: '[ngDiagramViewport]',
  standalone: true,
  host: {
    '[style.transform]': 'transform',
  },
})
export class ViewportDirective {
  viewport = input<Viewport>({ x: 0, y: 0, scale: 1 });

  get transform(): string {
    const vp = this.viewport();
    return `translate(${vp.x}px, ${vp.y}px) scale(${vp.scale})`;
  }
}
