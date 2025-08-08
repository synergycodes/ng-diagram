import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Node } from '@angularflow/core';
import { RotateHandleDirective } from '../../../../directives/input-events/rotate/rotate.directive';

@Component({
  selector: 'ng-diagram-rotate-handle',
  templateUrl: './ng-diagram-rotate-handle.component.html',
  styleUrls: ['./ng-diagram-rotate-handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.rotate-handle]': '!hasCustomHandle',
    '[class.ng-diagram-rotate-handle]': 'true',
  },
  hostDirectives: [{ directive: RotateHandleDirective, inputs: ['targetData: data'] }],
})
export class NgDiagramRotateHandleComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');

  data = input.required<Node>();

  isRotating = signal(false);

  hasCustomHandle = false;

  ngAfterContentInit(): void {
    this.hasCustomHandle = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }

  @HostBinding('attr.data-rotating') get pointerDownAttr() {
    return this.isRotating() ? 'true' : null;
  }

  @HostListener('pointerdown') pointerDown() {
    this.isRotating.set(true);
  }

  @HostListener('document:pointerup') pointerUp() {
    this.isRotating.set(false);
  }
}
