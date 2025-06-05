import {
  AfterViewInit,
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
import { EventMapperService, UpdatePortsService } from '../../../services';
import { RotateHandleComponent } from './handle/rotate-handle.component';

@Component({
  selector: 'angular-adapter-node-rotate-adornment',
  templateUrl: './node-rotate-adornment.component.html',
  styleUrl: './node-rotate-adornment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RotateHandleComponent],
})
export class NodeRotateAdornmentComponent implements AfterViewInit {
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly handleNode = viewChild('handleNode', { read: ElementRef<HTMLElement> });
  private readonly eventMapper = inject(EventMapperService);
  private readonly portsService = inject(UpdatePortsService);

  private get rotateHandleElement(): HTMLElement | null {
    return this.handleNode()?.nativeElement ?? null;
  }

  isRotating = signal(false);
  data = input.required<Node>();
  handleSize = signal(24);
  color = signal('#1e90ff');
  backgroundColor = signal('#fff');
  showAdornment = computed(() => !!this.data().selected || this.isRotating());

  ngAfterViewInit() {}

  // Accept all pointer event types from the child handle
  onPointerDownEvent({ event }: { event: PointerEvent }) {
    event.stopPropagation();
    event.preventDefault();

    this.isRotating.set(true);

    // Use pointer capture to ensure we receive all subsequent events
    const target = event.target as HTMLElement;
    target.setPointerCapture(event.pointerId);

    // Single pointermove listener
    const moveListener = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== event.pointerId) return;

      moveEvent.stopPropagation();
      moveEvent.preventDefault();

      const hostRect = this.hostElement.nativeElement.getBoundingClientRect();
      const handleRect = this.rotateHandleElement?.getBoundingClientRect();
      console.log({ portComponents: this.portsService.getNodePortsData(this.data().id) });
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
    };

    // Single pointerup listener
    const upListener = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== event.pointerId) return;

      upEvent.stopPropagation();
      upEvent.preventDefault();

      this.isRotating.set(false);

      // Release pointer capture
      const target = upEvent.target as HTMLElement;

      if (target.hasPointerCapture(upEvent.pointerId)) {
        target.releasePointerCapture(upEvent.pointerId);
      }

      // Clean up event listeners
      window.removeEventListener('pointermove', moveListener);
      window.removeEventListener('pointerup', upListener);
      window.removeEventListener('lostpointercapture', lostCaptureListener);
    };

    // Handle lost pointer capture (e.g., if user switches to another app)
    const lostCaptureListener = (lostEvent: PointerEvent) => {
      if (lostEvent.pointerId !== event.pointerId) return;

      console.log('LOST POINTER CAPTURE!'); // Debug log

      this.isRotating.set(false);

      // Clean up event listeners
      window.removeEventListener('pointermove', moveListener);
      window.removeEventListener('pointerup', upListener);
      window.removeEventListener('lostpointercapture', lostCaptureListener);
    };

    // Add event listeners to window to capture events even outside the element
    window.addEventListener('pointermove', moveListener);
    window.addEventListener('pointerup', upListener);
    window.addEventListener('lostpointercapture', lostCaptureListener);
  }
}
