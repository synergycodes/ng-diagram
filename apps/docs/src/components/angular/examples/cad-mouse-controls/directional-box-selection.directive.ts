import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import {
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  type Node,
  type Point,
  type Rect,
} from 'ng-diagram';
import { focusDiagram } from './focus-diagram';

export type BoxSelectionMode = 'window' | 'crossing';

interface SelectionRequest {
  rect: Rect;
  mode: BoxSelectionMode;
}

const PRIMARY_BUTTON = 0;
// Ports, resize and rotate handles, labels and relink handles live inside these
const DIAGRAM_ELEMENT_SELECTOR = 'ng-diagram-node, ng-diagram-edge';
// The id of the temporary node that stands for the box in the overlap query
const BOX_NODE_ID = 'directional-box-selection';

const isOnBackground = (event: PointerEvent) =>
  event.target instanceof Element &&
  event.target.closest('ng-diagram') !== null &&
  event.target.closest(DIAGRAM_ELEMENT_SELECTOR) === null;

const hasNoModifiers = (event: PointerEvent) =>
  !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;

const hasOnlyShift = (event: PointerEvent) =>
  event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;

const toRect = (a: Point, b: Point): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x),
  height: Math.abs(b.y - a.y),
});

const containsPoint = (rect: Rect, point: Point | undefined) =>
  !!point &&
  point.x >= rect.x &&
  point.x <= rect.x + rect.width &&
  point.y >= rect.y &&
  point.y <= rect.y + rect.height;

const containsNode = (rect: Rect, { position, size }: Node) =>
  !!size &&
  containsPoint(rect, position) &&
  containsPoint(rect, {
    x: position.x + size.width,
    y: position.y + size.height,
  });

// Draws its own selection box for a plain drag on the background and for Shift + drag anywhere.
// The drag direction picks the mode:
// - left to right is a window: it selects only the nodes that are fully inside
// - right to left is a crossing: it selects every node that the box touches
// Put it on an element that wraps <ng-diagram>: its capture listener takes these presses
// before the diagram sees them, so the diagram starts neither its own box nor panning.
@Directive({
  selector: '[directionalBoxSelection]',
  exportAs: 'directionalBoxSelection',
  host: {
    '[attr.data-box-selection-mode]': 'mode()',
  },
})
export class DirectionalBoxSelectionDirective {
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);

  // The mode of the box being drawn, null when there is no box
  readonly mode = signal<BoxSelectionMode | null>(null);
  // The box in the coordinates of the host, null when there is no box
  readonly box = signal<Rect | null>(null);

  private pointerId: number | null = null;
  private start: Point = { x: 0, y: 0 };
  private origin: Point = { x: 0, y: 0 };
  private pendingSelection: SelectionRequest | null = null;
  private isSelecting = false;

  constructor() {
    this.host.addEventListener('pointerdown', this.onPointerDown, {
      capture: true,
    });
    inject(DestroyRef).onDestroy(() => {
      this.host.removeEventListener('pointerdown', this.onPointerDown, {
        capture: true,
      });
      this.stop();
    });
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    const startsBox =
      event.button === PRIMARY_BUTTON &&
      event.pointerType !== 'touch' &&
      (hasOnlyShift(event) || (hasNoModifiers(event) && isOnBackground(event)));
    if (
      !startsBox ||
      this.pointerId !== null ||
      !this.diagramService.isInitialized()
    ) {
      return;
    }
    // The box is drawn here, so the press must not start a gesture of the diagram
    event.preventDefault();
    event.stopPropagation();
    focusDiagram(this.host);

    // The box is positioned inside the border of the host
    const bounds = this.host.getBoundingClientRect();
    this.origin = {
      x: bounds.left + this.host.clientLeft,
      y: bounds.top + this.host.clientTop,
    };
    this.start = { x: event.clientX, y: event.clientY };
    // With pointer capture, the moves and the release come to the host even outside of it
    this.host.setPointerCapture(event.pointerId);
    this.pointerId = event.pointerId;

    this.host.addEventListener('pointermove', this.onPointerMove);
    this.host.addEventListener('pointerup', this.onPointerUp);
    this.host.addEventListener('lostpointercapture', this.onLostPointerCapture);
  };

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    const end = { x: event.clientX, y: event.clientY };
    const mode = end.x >= this.start.x ? 'window' : 'crossing';
    this.mode.set(mode);
    this.box.set(toRect(this.toHost(this.start), this.toHost(end)));
    this.requestSelection(end, mode);
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    // A click without a move selects what is under the pointer, as a crossing does
    this.requestSelection(
      { x: event.clientX, y: event.clientY },
      this.mode() ?? 'crossing'
    );
    this.stop();
  };

  // The capture is also lost when the browser cancels the pointer
  private readonly onLostPointerCapture = (event: PointerEvent) => {
    if (event.pointerId === this.pointerId) {
      this.stop();
    }
  };

  private stop() {
    this.host.removeEventListener('pointermove', this.onPointerMove);
    this.host.removeEventListener('pointerup', this.onPointerUp);
    this.host.removeEventListener(
      'lostpointercapture',
      this.onLostPointerCapture
    );
    this.pointerId = null;
    this.mode.set(null);
    this.box.set(null);
  }

  private toHost(point: Point): Point {
    return { x: point.x - this.origin.x, y: point.y - this.origin.y };
  }

  private requestSelection(end: Point, mode: BoxSelectionMode) {
    const rect = toRect(
      this.viewportService.clientToFlowPosition(this.start),
      this.viewportService.clientToFlowPosition(end)
    );
    this.pendingSelection = { rect, mode };
    void this.applyPendingSelection();
  }

  // select() compares the new selection with the current one,
  // so each call waits for the previous one and only the latest box is applied
  private async applyPendingSelection() {
    if (this.isSelecting) {
      return;
    }
    this.isSelecting = true;
    try {
      while (this.pendingSelection) {
        const request = this.pendingSelection;
        this.pendingSelection = null;
        await this.selectInBox(request);
      }
    } finally {
      this.isSelecting = false;
    }
  }

  // The same rules as the built-in box selection, applied with the public API
  private selectInBox({ rect, mode }: SelectionRequest): Promise<void> {
    // A temporary node of the size of the box: the diagram returns the visible nodes it touches
    const touchedNodes = this.modelService.getOverlappingNodes({
      id: BOX_NODE_ID,
      position: { x: rect.x, y: rect.y },
      size: { width: rect.width, height: rect.height },
      data: {},
    });
    const nodes =
      mode === 'crossing'
        ? touchedNodes
        : touchedNodes.filter((node) => containsNode(rect, node));
    const nodeIds = new Set(nodes.map((node) => node.id));

    // An edge is selected when both of its ends are in the box:
    // a selected node, or a free end whose position is inside
    const isEndInBox = (nodeId: string, position: Point | undefined) =>
      nodeId ? nodeIds.has(nodeId) : containsPoint(rect, position);
    const edgeIds = this.modelService
      .getModel()
      .getEdges()
      .filter(
        (edge) =>
          !edge.computedHidden &&
          isEndInBox(edge.source, edge.sourcePosition) &&
          isEndInBox(edge.target, edge.targetPosition)
      )
      .map((edge) => edge.id);

    // select() replaces the current selection
    return this.selectionService.select([...nodeIds], edgeIds);
  }
}
