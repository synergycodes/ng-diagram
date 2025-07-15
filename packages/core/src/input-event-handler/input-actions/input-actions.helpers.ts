import { FlowCore } from '../../flow-core';
import { InputActionPredicate } from '../../types';
import { onEdge, onNode } from '../../types/__old__event/event-target.guards';
import { EventTarget } from '../../types/__old__event/event-target.interface';
import {
  isKey,
  isKeyboard,
  isStart,
  withMetaModifier,
  withPrimaryModifier,
  withSecondaryModifier,
  withShiftModifier,
} from '../../types/__old__event/event.guards';
import { __OLD__InputEvent, InputModifiers } from '../../types/__old__event/event.interface';

export const and = (...predicates: InputActionPredicate[]): InputActionPredicate => {
  return (event: __OLD__InputEvent, flowCore: FlowCore) => {
    return predicates.every((predicate) => predicate(event, flowCore));
  };
};

export const or = (...predicates: InputActionPredicate[]): InputActionPredicate => {
  return (event: __OLD__InputEvent, flowCore: FlowCore) => {
    return predicates.some((predicate) => predicate(event, flowCore));
  };
};

export const not = (predicate: InputActionPredicate): InputActionPredicate => {
  return (event: __OLD__InputEvent, flowCore: FlowCore) => {
    return !predicate(event, flowCore);
  };
};

export const none = (...predicates: InputActionPredicate[]): InputActionPredicate => {
  return not(or(...predicates));
};

export const keyCombo = (key: string, ...modifiers: (keyof InputModifiers)[]): InputActionPredicate => {
  const modifierPredicates = modifiers.map((mod) => {
    switch (mod) {
      case 'primary':
        return withPrimaryModifier;
      case 'secondary':
        return withSecondaryModifier;
      case 'shift':
        return withShiftModifier;
      case 'meta':
        return withMetaModifier;
      default:
        throw new Error(`Invalid modifier: ${mod}`);
    }
  });

  return and(isKeyboard, isStart, isKey(key), ...modifierPredicates);
};

export const hasSelection = (_: __OLD__InputEvent, flowCore: FlowCore): boolean => {
  const selectedNodes = flowCore.modelLookup.getSelectedNodes();
  const selectedEdges = flowCore.modelLookup.getSelectedEdges();

  return selectedNodes.length > 0 || selectedEdges.length > 0;
};

export const hasNoSelection = not(hasSelection);

export const targetIsSelected = (event: __OLD__InputEvent, flowCore: FlowCore): boolean => {
  const target = event.target;

  if (onNode(target)) {
    const selectedNodes = flowCore.modelLookup.getSelectedNodes();

    return selectedNodes.some((node) => node.id === target.element.id);
  }

  if (onEdge(target)) {
    const selectedEdges = flowCore.modelLookup.getSelectedEdges();

    return selectedEdges.some((edge) => edge.id === target.element.id);
  }

  return false;
};

export const targetIsNotSelected = not(targetIsSelected);

/**
 * Returns a predicate that checks if the event target matches the given type guard function.
 * Example: targetIs(onNode), targetIs(onEdge)
 */
export const targetIs =
  <T extends EventTarget>(typeGuard: (target: EventTarget) => target is T) =>
  (event: __OLD__InputEvent): boolean =>
    typeGuard(event.target);
