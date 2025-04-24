import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[angularAdapterNodePosition]',
})
export class NodePositionDirective {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  position = input<{ x: number; y: number }>({ x: 0, y: 0 });

  constructor() {
    effect(() => {
      this.setStyle('transform', `translate(${this.position().x}px, ${this.position().y}px)`);
    });
  }

  private setStyle(styleName: string, value: string) {
    this.renderer.setStyle(this.hostElement.nativeElement, styleName, value);
  }
}
