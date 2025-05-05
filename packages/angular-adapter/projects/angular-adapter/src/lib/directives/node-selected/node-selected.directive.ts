import { Directive, effect, ElementRef, inject, input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[angularAdapterNodeSelected]',
})
export class NodeSelectedDirective {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  selected = input<boolean | undefined>(false);

  constructor() {
    this.setStyle('transition', 'box-shadow 0.1s ease-in-out');
    effect(() => {
      this.setStyle('box-shadow', this.selected() ? '0 0 2px 4px rgba(30, 144, 255, 0.5)' : 'none');
    });
  }

  private setStyle(styleName: string, value: string) {
    this.renderer.setStyle(this.hostElement.nativeElement, styleName, value);
  }
}
