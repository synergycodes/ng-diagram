---
editUrl: false
next: false
prev: false
title: "ActionName"
---

> **ActionName** = `KeyboardMoveSelectionAction` \| `KeyboardPanAction` \| `Exclude`\<`InputEventName`, `"keyboardMoveSelection"` \| `"keyboardPanning"`\>

All valid action names for shortcuts

Includes:
- Specific mapped actions (e.g., 'keyboardMoveSelectionUp', 'keyboardPanUp')
- Direct event names (e.g., 'copy', 'cut', 'deleteSelection')

Excludes events that must be used through specific directional actions:
- 'keyboardMoveSelection' (use keyboardMoveSelectionUp/Down/Left/Right instead)
- 'keyboardPanning' (use keyboardPanUp/Down/Left/Right instead)
