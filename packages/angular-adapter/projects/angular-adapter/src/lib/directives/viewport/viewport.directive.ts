import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';
import { Viewport } from '@angularflow/core';

@Directive({
  selector: '[angularAdapterViewport]',
})
export class ViewportDirective {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  viewport = input<Viewport>({ x: 0, y: 0, scale: 1 });

  constructor() {
    effect(() => {
      this.setStyle(
        'transform',
        `translate(${this.viewport().x}px, ${this.viewport().y}px) scale(${this.viewport().scale})`
      );
    });
  }

  private setStyle(styleName: string, value: string) {
    this.renderer.setStyle(this.hostElement.nativeElement, styleName, value);
  }
}
