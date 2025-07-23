import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  input,
  viewChild,
} from '@angular/core';
import { Node } from '@angularflow/core';
import { RotateHandleDirective } from '../../../../directives/input-events/rotate/rotate.directive';

@Component({
  selector: 'angular-adapter-rotate-handle',
  templateUrl: './rotate-handle.component.html',
  styleUrls: ['./rotate-handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.rotate-handle]': '!hasCustomHandle',
  },
  hostDirectives: [{ directive: RotateHandleDirective, inputs: ['target: data'] }],
})
export class RotateHandleComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');

  data = input.required<Node>();
  isRotating = input.required<boolean>();

  hasCustomHandle = false;

  ngAfterContentInit(): void {
    this.hasCustomHandle = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }

  @HostBinding('attr.data-rotating') get pointerDownAttr() {
    return this.isRotating() ? 'true' : null;
  }
}
