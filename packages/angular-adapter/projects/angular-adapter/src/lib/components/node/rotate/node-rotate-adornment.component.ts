import { ChangeDetectionStrategy, Component, computed, ElementRef, input, signal, viewChild } from '@angular/core';
import { Node } from '@angularflow/core';
import { RotateHandleComponent } from './handle/rotate-handle.component';

@Component({
  selector: 'angular-adapter-node-rotate-adornment',
  templateUrl: './node-rotate-adornment.component.html',
  styleUrl: './node-rotate-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RotateHandleComponent],
  host: {
    class: 'node-rotate-adornment',
  },
})
export class NodeRotateAdornmentComponent {
  private readonly handleNode = viewChild('handleNode', { read: ElementRef<HTMLElement> });

  /**
   * Returns the rotate handle HTMLElement, or null if not available.
   */
  private get rotateHandleElement(): HTMLElement | null {
    return this.handleNode()?.nativeElement ?? null;
  }

  readonly isRotating = signal(false);
  readonly data = input.required<Node>();
  readonly eventTarget = computed(() => ({ type: 'rotate-handle' as const, element: this.data() }));
  readonly showAdornment = computed(() => !!this.data().selected || this.isRotating());
}
