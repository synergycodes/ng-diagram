import { isKeyboardDownEvent, type InputActionWithPredicate } from '../../types';

export const pasteAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    let pastePosition: { x: number; y: number } | undefined;

    if (event.cursorPosition) {
      // Convert client coordinates to flow coordinates
      pastePosition = flowCore.clientToFlowPosition(event.cursorPosition);
      console.log('Paste action triggered at cursor position:', pastePosition);
    }

    flowCore.commandHandler.emit('paste', pastePosition ? { position: pastePosition } : {});
  },
  predicate: (event, flowCore) => {
    if (!isKeyboardDownEvent(event)) {
      return false;
    }

    const modifierKey = flowCore.environment.os === 'MacOS' ? event.metaKey : event.ctrlKey;
    return event.key === 'v' && modifierKey;
  },
};
