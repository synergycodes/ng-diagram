// MIGRATED TO NEW INPUT ACTIONS

import { type Edge, type InputActionWithPredicate, type Node } from '../../types';
import { onResizeHandle } from '../../types/__old__event/event-target.guards';
import { isPointer, isSelectEvent, withPrimaryModifier } from '../../types/__old__event/event.guards';
import { PointerInputEvent } from '../../types/__old__event/event.interface';
import { and, not, targetIs } from './input-actions.helpers';

interface TargetElements {
  nodeIds: string[] | undefined;
  edgeIds: string[] | undefined;
}

const getTargetElementIds = (event: PointerInputEvent): TargetElements | null => {
  if (!event.target || (event.target.type !== 'node' && event.target.type !== 'edge')) {
    return null;
  }

  const target = event.target;

  return {
    nodeIds: target.type === 'node' ? [target.element.id] : undefined,
    edgeIds: target.type === 'edge' ? [target.element.id] : undefined,
  };
};

const findClickedElement = (targetElements: TargetElements, nodes: Node[], edges: Edge[]): Node | Edge | undefined => {
  if (targetElements.nodeIds) {
    return nodes.find((n) => n.id === targetElements.nodeIds![0]);
  }
  return edges.find((e) => e.id === targetElements.edgeIds![0]);
};

export const selectAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    // Type guard to ensure we have a pointer event
    if (!isPointer(event)) return;

    const targetElements = getTargetElementIds(event);
    if (!targetElements) {
      flowCore.commandHandler.emit('deselectAll');
      return;
    }

    const { nodes, edges } = flowCore.getState();
    const clickedElement = findClickedElement(targetElements, nodes, edges);
    const isAlreadySelected = clickedElement?.selected;
    const isModifierPressed = withPrimaryModifier(event);

    if (isAlreadySelected && isModifierPressed) {
      flowCore.commandHandler.emit('deselect', targetElements);
      return;
    }

    flowCore.commandHandler.emit('select', {
      ...targetElements,
      preserveSelection: isAlreadySelected || isModifierPressed,
    });
  },
  predicate: and(isSelectEvent, not(targetIs(onResizeHandle))),
};
