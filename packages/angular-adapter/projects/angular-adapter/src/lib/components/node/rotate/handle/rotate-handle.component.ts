import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'angular-adapter-rotate-handle',
  templateUrl: './rotate-handle.component.html',
  styleUrls: ['./rotate-handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.rotate-handle]': '!hasCustomHandle',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class RotateHandleComponent implements AfterContentInit {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');

  isRotating = input.required<boolean>();
  pointerDownEvent = output<{ event: PointerEvent }>();

  hasCustomHandle = false;

  ngAfterContentInit(): void {
    this.hasCustomHandle = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }

  @HostBinding('attr.data-rotating') get pointerDownAttr() {
    return this.isRotating() ? 'true' : null;
  }

  onPointerDown(event: PointerEvent) {
    this.pointerDownEvent.emit({ event });
  }
}
