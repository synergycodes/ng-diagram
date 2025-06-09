import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Node } from '@angularflow/core';
import { NodeSelectedDirective } from '../../../directives';
import { EventMapperService, UpdatePortsService } from '../../../services';
import { RotateHandleComponent } from './handle/rotate-handle.component';

@Component({
  selector: 'angular-adapter-node-rotate-adornment',
  templateUrl: './node-rotate-adornment.component.html',
  styleUrl: './node-rotate-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RotateHandleComponent],
  hostDirectives: [{ directive: NodeSelectedDirective, inputs: ['data'] }],
})
export class NodeRotateAdornmentComponent {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly handleNode = viewChild('handleNode', { read: ElementRef<HTMLElement> });
  private readonly eventMapper = inject(EventMapperService);
  private readonly portsService = inject(UpdatePortsService);

  /**
   * Returns the rotate handle HTMLElement, or null if not available.
   */
  private get rotateHandleElement(): HTMLElement | null {
    return this.handleNode()?.nativeElement ?? null;
  }

  readonly isRotating = signal(false);
  readonly data = input.required<Node>();
  readonly handleSize = signal(24);
  readonly color = signal('#1e90ff');
  readonly backgroundColor = signal('#fff');
  readonly showAdornment = computed(() => !!this.data().selected || this.isRotating());

  /**
   * Handles pointer down event on the rotate handle.
   * @param param0 Pointer event wrapper
   */
  onPointerDownEvent({ event }: { event: PointerEvent }): void {
    event.stopPropagation();
    event.preventDefault();

    this.isRotating.set(true);

    // Use pointer capture to ensure we receive all subsequent events
    const target = event.target as HTMLElement;
    target.setPointerCapture(event.pointerId);

    this.addPointerListeners(event.pointerId, target);
  }

  /**
   * Adds pointer event listeners for rotation.
   * @param pointerId The pointer ID to track
   * @param target The target HTMLElement
   */
  private addPointerListeners(pointerId: number, target: HTMLElement): void {
    const moveListener = (moveEvent: PointerEvent) => this.onPointerMove(moveEvent, pointerId);
    const upListener = (upEvent: PointerEvent) =>
      this.onPointerUp(upEvent, pointerId, target, moveListener, upListener, lostCaptureListener);
    const lostCaptureListener = (lostEvent: PointerEvent) =>
      this.onLostPointerCapture(lostEvent, pointerId, moveListener, upListener, lostCaptureListener);

    window.addEventListener('pointermove', moveListener);
    window.addEventListener('pointerup', upListener);
    window.addEventListener('lostpointercapture', lostCaptureListener);
  }

  /**
   * Handles pointer move event during rotation.
   */
  private onPointerMove(moveEvent: PointerEvent, pointerId: number): void {
    if (moveEvent.pointerId !== pointerId) return;

    moveEvent.stopPropagation();
    moveEvent.preventDefault();

    const hostRect = this.hostElement.nativeElement.getBoundingClientRect();
    const handleRect = this.rotateHandleElement?.getBoundingClientRect();

    this.eventMapper.emit({
      type: 'rotate',
      timestamp: Date.now(),
      target: { type: 'rotate-handle', element: this.data() },
      mouse: { x: moveEvent.clientX, y: moveEvent.clientY },
      center: {
        x: hostRect.left + hostRect.width / 2,
        y: hostRect.top + hostRect.height / 2,
      },
      handle: handleRect
        ? {
            x: handleRect.left + this.handleSize() / 2,
            y: handleRect.top + this.handleSize() / 2,
          }
        : { x: 0, y: 0 },
      ports: this.portsService.getNodePortsData(this.data().id),
    });
  }

  /**
   * Handles pointer up event, cleaning up listeners and state.
   */
  private onPointerUp(
    upEvent: PointerEvent,
    pointerId: number,
    target: HTMLElement,
    moveListener: (e: PointerEvent) => void,
    upListener: (e: PointerEvent) => void,
    lostCaptureListener: (e: PointerEvent) => void
  ): void {
    if (upEvent.pointerId !== pointerId) return;

    upEvent.stopPropagation();
    upEvent.preventDefault();

    this.isRotating.set(false);

    if (target.hasPointerCapture(upEvent.pointerId)) {
      target.releasePointerCapture(upEvent.pointerId);
    }
    window.removeEventListener('pointermove', moveListener);
    window.removeEventListener('pointerup', upListener);
    window.removeEventListener('lostpointercapture', lostCaptureListener);
  }

  /**
   * Handles lost pointer capture event, cleaning up listeners and state.
   * eg. when the user clicks outside the rotate handle or switches to another tab
   */
  private onLostPointerCapture(
    lostEvent: PointerEvent,
    pointerId: number,
    moveListener: (e: PointerEvent) => void,
    upListener: (e: PointerEvent) => void,
    lostCaptureListener: (e: PointerEvent) => void
  ): void {
    if (lostEvent.pointerId !== pointerId) return;

    this.isRotating.set(false);

    window.removeEventListener('pointermove', moveListener);
    window.removeEventListener('pointerup', upListener);
    window.removeEventListener('lostpointercapture', lostCaptureListener);
  }
}
