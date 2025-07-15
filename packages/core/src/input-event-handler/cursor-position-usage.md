# Cursor Position in Input Actions

All input actions now receive the latest cursor position through the `cursorPosition` property on events.

## Usage

```typescript
import { isKeyboardDownEvent, type InputActionWithPredicate } from '../../types';

export const myCustomAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    // Access cursor position if available
    const eventWithCursor = event as typeof event & { cursorPosition?: { x: number; y: number } };

    if (eventWithCursor.cursorPosition) {
      // Convert client coordinates to flow coordinates
      const flowPosition = flowCore.clientToFlowPosition(eventWithCursor.cursorPosition);

      // Use the cursor position for your action
      console.log('Action triggered at cursor position:', flowPosition);

      // Example: Create a node at cursor position
      flowCore.commandHandler.emit('addNodes', {
        nodes: [
          {
            id: crypto.randomUUID(),
            type: 'default',
            position: flowPosition,
            data: { label: 'New Node' },
          },
        ],
      });
    }

    // Continue with your action logic
  },
  predicate: (event, flowCore) => {
    // Your predicate logic
    return isKeyboardDownEvent(event) && event.key === 'n' && event.ctrlKey;
  },
};
```

## Built-in Actions Using Cursor Position

### Paste Action

The paste action now uses cursor position to paste nodes at the cursor location and automatically regenerates IDs:

```typescript
export const pasteAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    let pastePosition: { x: number; y: number } | undefined;

    if (event.cursorPosition) {
      pastePosition = flowCore.clientToFlowPosition(event.cursorPosition);
    }

    // Paste command now accepts position parameter
    // Automatically regenerates node port IDs and edge label IDs
    flowCore.commandHandler.emit('paste', pastePosition ? { position: pastePosition } : {});
  },
  // ... predicate logic
};
```

#### ID Regeneration

When pasting, the following IDs are automatically regenerated to prevent conflicts:

- **Node IDs**: All pasted nodes get new unique IDs (prevents duplicate nodes)
- **Port IDs**: Port IDs are preserved to maintain compatibility with hardcoded template references
- **Port nodeId References**: Updated to match new node IDs
- **Edge IDs**: All pasted edges get new unique IDs (prevents duplicate edges and enables independent selection/manipulation)
- **Edge Label IDs**: Preserved to maintain consistency with original labels
- **Edge References**: Source and target node references are updated to match new node IDs
- **Edge Port References**: Preserved to maintain compatibility with template-defined port IDs

**Why this approach is used:**

- **Port IDs** are often hardcoded in Angular templates (e.g., `"port-left"`, `"port-right"`) and must remain consistent
- **Edge IDs** are used as keys in model lookups, middleware tracking, and commands
- **Edge Label IDs** are preserved to maintain label consistency and avoid breaking references
- **Node IDs** must be unique to prevent conflicts between original and pasted nodes

This ensures that pasted elements work correctly with existing templates while maintaining system integrity.

## How It Works

1. **Pointer Events**: Automatically include cursor position from the event itself
2. **Keyboard Events**: Include the last known cursor position from the cursor tracker
3. **Wheel Events**: Include cursor position from the event itself
4. **Fallback**: If no recent cursor position is available, `cursorPosition` will be `undefined`

## Coordinate Systems

- `cursorPosition`: Client coordinates (relative to viewport)
- `flowPosition`: Flow coordinates (relative to diagram, accounting for zoom/pan)

Use `flowCore.clientToFlowPosition()` to convert between coordinate systems.

## Availability

- **Always available**: Pointer events, wheel events
- **Usually available**: Keyboard events (if mouse moved recently)
- **May be undefined**: If no mouse movement has occurred recently (5 second timeout)
