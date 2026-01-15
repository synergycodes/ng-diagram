# Event System Documentation - ng-diagram

## Table of Contents

1. [System Overview](#system-overview)
2. [Desktop Events](#desktop-events)
3. [Mobile Events](#mobile-events)
4. [TouchEventsStateService](#toucheventsstateservice)
5. [Coordination Mechanisms](#coordination-mechanisms)
6. [Priority Hierarchy](#priority-hierarchy)
7. [Summary](#summary)

---

## System Overview

The event handling system in ng-diagram uses a **hybrid approach**, combining native Pointer Events API with dedicated Touch Events handling for mobile devices. The architecture is based on modular Angular directives that can be independently attached to diagram components.
Read more about why changes were applied [TouchEventsStateService](#toucheventsstateservice)

### Key Features:

- **Desktop/Mobile Separation**: Separate directives for different device types
- **Centralized Coordination**: TouchEventsStateService manages mobile event state
- **Conflict Prevention**: System of flagging and event state checking

---

## Desktop Events

### 1. **Box Selection**

**Directive**: `BoxSelectionDirective`

**Technology**: Pointer Events (standard)

**Implementation details**:

- Uses capture phase for pointerdown (`{ capture: true }`)
- Detects keyboard modifiers (Shift) for additive/subtractive mode
- Optional realtime update (can enable immediate selection during movement)
- Partial inclusion support (selecting elements partially within area)

**Activation conditions**:

- Primary button (left mouse button)
- Keyboard modifier (Ctrl/Cmd or Shift)

---

### 2. **Panning** (Viewport Scrolling)

**Directive**: `PanningDirective`

**Technology**: Pointer Events + Wheel Events

**Implementation details**:

- **Touch filtering**: Ignores `event.pointerType === 'touch'` (delegates to mobile)
- **Wheel panning**: Shift + horizontal/vertical scroll
- **Grabbing cursor**: Dynamic cursor change during panning
- Requires primary button (left mouse button)

**Activation conditions**:

- viewportPanningEnabled === true
- **Not a touch device**
- No conflicting events (move, zoom, linking, rotate, box selection)

---

### 3. **Zooming** (Zoom In/Out)

**Directive**: `ZoomingWheelDirective`

**Technology**: Wheel Events (standard)

**Implementation details**:

- Configurable zoom step (`flow.config.zoom.step`)
- Zoom relative to cursor position (centerPoint)
- Requires no primary modifier (Ctrl/Cmd) - otherwise it's panning

**Activation conditions**:

- No primary modifier (Ctrl/Cmd used for wheel panning)

---

### 4. **Node Move**

**Directive**: `PointerMoveSelectionDirective`

**Technology**: Pointer Events

**Implementation details**:

- **Edge Panning**: Automatic viewport scrolling at edges (with configurable threshold and force)
- **Interval-based panning**: 60 FPS for smooth edge panning

**Activation conditions**:

- Primary button
- No conflicts: zoomingHandled, linkingHandled, rotateHandled, boxSelectionHandled

**Operation interruption**:

- When zoomingHandled, boxSelectionHandled, panningHandled, or zoomingHandled becomes true - immediately calls finishDragging()

---

### 5. **Resize** (Node Resizing)

**Directive**: `ResizeDirective`

**Technology**: Pointer Events

**Activation conditions**:

- No box selection
- TouchEventsStateService: no panningHandled() or zoomingHandled()

**Operation interruption**:

- When panningHandled() or zoomingHandled() becomes true - immediately ends resize (onPointerUp)

---

### 6. **Rotate** (Node Rotation)

**Directive**: `RotateHandleDirective`

**Technology**: Pointer Events

**Activation conditions**:

- No box selection
- TouchEventsStateService: no panningHandled() or zoomingHandled()

**Operation interruption**:

- When panningHandled() or zoomingHandled() becomes true - immediately ends rotation

---

### 7. **Linking** (Creating Connections)

**Directive**: `LinkingInputDirective`

**Technology**: Pointer Events

**Implementation details**:

- **Edge Panning**: Similar to move, automatic scrolling at edges
- **Port snapping**: Detection of nearby ports
- **Temporary edge**: Visual preview during connection
- Uses dedicated `LinkingEventService` as provider
- 60 FPS interval for edge panning

**Activation conditions**:

- Linking not already active (ActionStateManager.isLinking())
- No box selection
- TouchEventsStateService: no panningHandled() or zoomingHandled()

**Operation interruption**:

- When panningHandled() or zoomingHandled() becomes true - immediately ends linking

---

## Mobile Events

### 1. **Mobile Box Selection**

**Directive**: `MobileBoxSelectionDirective`

**Technology**: Touch Events (dedicated implementation) - one finger touch (400ms)

**Implementation details**:

- **Long Press Detection**: 400ms timeout before activation
- **TouchEventsStateService**: Sets DiagramEventName.BoxSelection
- **Conflict checking**: Verifies if other touch events (rotate, resize, linking) are not active
- **Single touch**: Requires exactly one touch
- **Timer cleanup**: Cancels timer on movement or end

**Activation conditions**:

- Single touch
- Long press (400ms hold)
- No active: rotateHandled(), resizeHandled(), linkingHandled()

---

### 2. **Mobile Panning**

**Directive**: `MobilePanningDirective`

**Technology**: Touch Events (dedicated implementation) - 2 fingers touch

**Implementation details**:

- **Two-finger gesture**: Requires exactly 2 touches
- **Midpoint calculation**: Calculates center between two fingers
- **Conflict prevention**: Checks zoomingHandled() before and during operation
- **TouchEventsStateService**: Sets DiagramEventName.Panning

**Activation conditions**:

- Two-finger touch (touches.length === 2)
- viewportPanningEnabled === true
- No zoomingHandled()

**Operation interruption**:

- When zooming becomes active during panning
- Immediately clears state and ends

---

### 3. **Mobile Zooming**

**Directive**: `MobileZoomingDirective`

**Technology**: Touch Events (dedicated implementation) - 2 fingers touch

**Implementation details**:

- **Pinch gesture**: Detection of two fingers moving closer/farther
- **Touch cache**: Stores Touch objects for accurate calculation
- **Threshold detection**: ZOOM_TRIGGER_DELTA = 40px (prevents accidental zoom)
- **Center point**: Zoom relative to center between fingers
- **TouchEventsStateService**: Sets DiagramEventName.Zooming after threshold exceeded

**Threshold system**:

- Doesn't activate zoom immediately on two touches
- Waits for delta > 40px from initial distance
- Allows panning without accidental zoom
- Once activated, remains active until gesture ends

---

## TouchEventsStateService

**Location**: `services/touch-events-state-service/touch-events-state-service.service.ts`

**Type**: Injectable, providedIn: 'root' (singleton)

### Role:

Central coordination point for mobile touch events, preventing conflicts between different gestures on touch devices.

**Why it was created**: On mobile devices, both Touch Events and Pointer Events are triggered simultaneously. Since Pointer Events are also fired on touch devices (as a compatibility layer), this creates conflicts when the same user gesture triggers multiple event handlers. TouchEventsStateService acts as a coordination layer between these two event systems, tracking which event type (touch or pointer) is currently active. This allows directives to query the current state and avoid processing the same gesture twice, ensuring that touch-specific implementations (like two-finger panning/zooming) don't conflict with pointer-based implementations (like node move/resize/rotate).

### Interface:

```typescript
class TouchEventsStateService {
  // Signal storing current event type
  currentEvent: WritableSignal<DiagramEventName | null>;

  // Management methods
  clearCurrentEvent(): void;

  // State checking methods (query methods)
  rotateHandled(): boolean;
  resizeHandled(): boolean;
  moveHandled(): boolean;
  boxSelectionHandled(): boolean;
  linkingHandled(): boolean;
  panningHandled(): boolean;
  zoomingHandled(): boolean;
}
```

### Event types (DiagramEventName):

- `Rotate` - node rotation
- `Resize` - node resizing
- `Move` - moving nodes
- `BoxSelection` - box selection
- `Linking` - creating connections
- `Panning` - viewport scrolling (2 fingers)
- `Zooming` - pinch zoom gesture (2 fingers)

### Sample usage flow:

1. **Starting gesture**:

```typescript
this.touchEventsStateService.currentEvent.set(DiagramEventName.Panning);
```

2. **Checking conflicts** (before starting another gesture):

```typescript
if (this.touchEventsStateService.zoomingHandled()) {
  // Don't start panning
  return;
}
```

3. **Monitoring during operation** (in onMove/onContinue):

```typescript
if (this.touchEventsStateService.panningHandled()) {
  // Interrupt current operation
  this.cleanup();
  return;
}
```

4. **Finishing**:

```typescript
this.touchEventsStateService.clearCurrentEvent();
```

---

## Coordination Mechanisms

### 1. **Pointer Events Flags** (Desktop)

Flags set on event object for desktop events:

```typescript
interface PointerInputEvent extends PointerEvent {
  moveSelectionHandled?: boolean;
  zoomingHandled?: boolean;
  linkingHandled?: boolean;
  rotateHandled?: boolean;
  selectHandled?: boolean;
  boxSelectionHandled?: boolean;
}
```

**Usage**:

- Set by directives after starting action
- Checked by other directives in shouldHandle()
- Prevents multiple handling of same event
- Scope: single event object (local)

### 2. **TouchEventsStateService** (Mobile)

Global state for touch events:

- Scope: entire application (singleton)
- Persistence: throughout gesture duration
- Real-time checking: can check at any moment
- Atomic updates: Signal-based (Angular Signals)
- Used to synchronize between touch and pointer events.

---

## Priority Hierarchy

**Mobile 2-finger gestures**:

1. Zooming (pinch) - highest priority
   - Once activated, blocks panning
   - Panning can be interrupted by zoom
2. Panning (2-finger drag)
   - Checks if zoom is not active
   - Ends when zoom starts

**Single touch mobile**:

1. Box Selection (long press)
2. Resize
3. Rotate
4. Linking
5. Move

**Desktop**:

- Box Selection (with modifier)
- All others depending on target and context

---

## Summary

### Desktop Events (Pointer Events):

1. Box Selection - `pointerdown` with modifier
2. Panning - `pointerdown` (non-touch) + `wheel` (with Shift)
3. Zooming - `wheel` (without modifier)
4. Selection - `pointerdown` (node/edge/diagram)
5. Move - `pointerdown` (on node) + drag
6. Resize - `pointerdown` (on handle) + drag
7. Rotate - `pointerdown` (on rotate handle) + drag
8. Linking - `pointerdown` (on port) + drag
9. Palette Drop - `drop` + `dragover`

### Mobile Events (Touch Events - dedicated):

1. Box Selection - `touchstart` (long press 400ms) + `touchmove`
2. Panning - `touchstart` (2 fingers) + `touchmove`
3. Zooming - `touchstart` (2 fingers pinch) + `touchmove`
4. Palette Drop - `touchmove` + `touchend` (hybrid)

### Mobile using Pointer Events:

1. Selection - pointer events work on touch automatically
2. Move - pointer events (touch handled)
3. Resize - pointer events (touch handled)
4. Rotate - pointer events (touch handled)
5. Linking - pointer events (touch handled)
