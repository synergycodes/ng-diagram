import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import {
  configureShortcuts,
  NgDiagramService,
  type ModifierOnlyShortcutBinding,
  type PointerOnlyShortcutDefinition,
  type ShortcutDefinition,
} from 'ng-diagram';

export type BoxSelectionMode = 'window' | 'crossing';

const PRIMARY_BUTTON = 0;
// Ports, resize and rotate handles, labels and relink handles live inside these
const DIAGRAM_ELEMENT_SELECTOR = 'ng-diagram-node, ng-diagram-edge';

const NO_MODIFIER_BINDING: ModifierOnlyShortcutBinding = { modifiers: {} };

const isNoModifierBinding = ({ modifiers }: ModifierOnlyShortcutBinding) =>
  !Object.values(modifiers).some(Boolean);

const isBoxSelection = (
  shortcut: ShortcutDefinition
): shortcut is PointerOnlyShortcutDefinition =>
  shortcut.actionName === 'boxSelection';

const isOnBackground = (event: PointerEvent) =>
  event.target instanceof Element &&
  event.target.closest('ng-diagram') !== null &&
  event.target.closest(DIAGRAM_ELEMENT_SELECTOR) === null;

const hasNoModifiers = (event: PointerEvent) =>
  !event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;

const hasOnlyShift = (event: PointerEvent) =>
  event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey;

// Starts a box selection with a plain drag on the background, and picks the mode
// from the drag direction:
// - left to right is a window: it selects only the nodes that are fully inside
// - right to left is a crossing: it selects every node that the box touches
// Put it on an element that wraps <ng-diagram>: its capture listener runs
// before the one that decides if a press starts a box selection.
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

  // The mode of the box being drawn, null when there is no box
  readonly mode = signal<BoxSelectionMode | null>(null);

  private pointerId: number | null = null;
  private startX = 0;

  constructor() {
    this.host.addEventListener('pointerdown', this.onPointerDown, {
      capture: true,
    });
    inject(DestroyRef).onDestroy(() => {
      this.host.removeEventListener('pointerdown', this.onPointerDown, {
        capture: true,
      });
      this.stopTracking();
    });
  }

  private readonly onPointerDown = (event: PointerEvent) => {
    if (!this.diagramService.isInitialized()) {
      return;
    }
    const isMousePrimary =
      event.button === PRIMARY_BUTTON && event.pointerType !== 'touch';
    const pressesBackground = isMousePrimary && isOnBackground(event);

    // A press on a node or an edge must keep selecting, dragging and linking,
    // so a box without a modifier is allowed only for this press on the background
    this.setPlainDragSelects(pressesBackground);

    const startsBox =
      isMousePrimary &&
      (hasOnlyShift(event) || (pressesBackground && hasNoModifiers(event)));
    if (startsBox) {
      this.startTracking(event);
    }
  };

  // The diagram reads the shortcuts on every press, so the change applies to this press
  private setPlainDragSelects(plainDragSelects: boolean) {
    const currentShortcuts = this.diagramService.config()
      .shortcuts as ShortcutDefinition[];
    const bindings = currentShortcuts.find(isBoxSelection)?.bindings ?? [];
    // The other bindings, by default Shift, stay as they are
    const modifierBindings = bindings.filter(
      (binding) => !isNoModifierBinding(binding)
    );
    const hasNoModifierBinding = modifierBindings.length !== bindings.length;
    if (plainDragSelects === hasNoModifierBinding) {
      return;
    }

    const shortcuts = configureShortcuts(
      [
        {
          actionName: 'boxSelection',
          bindings: plainDragSelects
            ? [NO_MODIFIER_BINDING, ...modifierBindings]
            : modifierBindings,
        },
      ],
      currentShortcuts
    );
    this.diagramService.updateConfig({ shortcuts });
  }

  private startTracking(event: PointerEvent) {
    this.stopTracking();
    this.pointerId = event.pointerId;
    this.startX = event.clientX;

    // The diagram stops these events on the document, so they are listened to in the capture phase
    window.addEventListener('pointermove', this.onPointerMove, {
      capture: true,
    });
    window.addEventListener('pointerup', this.onPointerEnd, { capture: true });
    window.addEventListener('pointercancel', this.onPointerEnd, {
      capture: true,
    });
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerId === this.pointerId) {
      this.setMode(event.clientX >= this.startX ? 'window' : 'crossing');
    }
  };

  private readonly onPointerEnd = (event: PointerEvent) => {
    if (event.pointerId === this.pointerId) {
      this.stopTracking();
    }
  };

  private stopTracking() {
    window.removeEventListener('pointermove', this.onPointerMove, {
      capture: true,
    });
    window.removeEventListener('pointerup', this.onPointerEnd, {
      capture: true,
    });
    window.removeEventListener('pointercancel', this.onPointerEnd, {
      capture: true,
    });
    this.pointerId = null;
    this.mode.set(null);
  }

  // The selection reads `partialInclusion` on every move, so the mode can change mid-drag
  private setMode(mode: BoxSelectionMode) {
    this.mode.set(mode);

    const partialInclusion = mode === 'crossing';
    if (
      this.diagramService.config().boxSelection?.partialInclusion !==
      partialInclusion
    ) {
      this.diagramService.updateConfig({ boxSelection: { partialInclusion } });
    }
  }
}
