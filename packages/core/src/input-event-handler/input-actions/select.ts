import {
  isPointerDownEvent,
  isResizeHandleTarget,
  type Edge,
  type EventTarget,
  type InputActionWithPredicate,
  type Node,
} from '../../types';

interface TargetElements {
  nodeIds: string[] | undefined;
  edgeIds: string[] | undefined;
}

const getTargetElementIds = (event: { target?: EventTarget }): TargetElements | null => {
  if (!event.target || (event.target.type !== 'node' && event.target.type !== 'edge')) {
    return null;
  }

  const target = event.target as EventTarget & { element: { id: string } };
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
    if (!isPointerDownEvent(event)) {
      return;
    }

    const targetElements = getTargetElementIds(event);
    if (!targetElements) {
      flowCore.commandHandler.emit('deselectAll');
      return;
    }

    const { nodes, edges } = flowCore.getState();
    const clickedElement = findClickedElement(targetElements, nodes, edges);
    const isAlreadySelected = clickedElement?.selected;
    const isModifierPressed = flowCore.environment.os === 'MacOS' ? event.metaKey : event.ctrlKey;

    if (isAlreadySelected && isModifierPressed) {
      flowCore.commandHandler.emit('deselect', targetElements);
      return;
    }

    flowCore.commandHandler.emit('select', {
      ...targetElements,
      preserveSelection: isAlreadySelected || isModifierPressed,
    });
  },
  predicate: (event) => isPointerDownEvent(event) && !isResizeHandleTarget(event.target),
};
