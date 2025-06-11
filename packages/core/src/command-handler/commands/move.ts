import type { CommandHandler, ModelActionType } from '../../types';
import type { Node } from '../../types/node.interface';

interface BaseMoveCommand {
  dx: number;
  dy: number;
}

export interface MoveSelectionCommand extends BaseMoveCommand {
  name: 'moveSelection';
}

export interface MoveNodesCommand extends BaseMoveCommand {
  name: 'moveNodes';
  nodes: Node[];
}

interface MoveNodesInFlowParams {
  commandHandler: CommandHandler;
  nodes: Node[];
  delta: {
    x: number;
    y: number;
  };
  actionName: ModelActionType;
}

const moveNodesInFlow = ({ commandHandler, nodes, delta, actionName }: MoveNodesInFlowParams): void => {
  if (nodes.length === 0) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: nodes.map((node) => ({
        id: node.id,
        position: {
          x: Math.round(node.position.x + delta.x),
          y: Math.round(node.position.y + delta.y),
        },
      })),
    },
    actionName
  );
};

export const moveSelection = (commandHandler: CommandHandler, { dx, dy }: MoveSelectionCommand): void => {
  const nodesToMove = commandHandler.flowCore.modelLookup.getSelectedNodesWithChildren();

  moveNodesInFlow({
    commandHandler,
    nodes: nodesToMove,
    delta: { x: dx, y: dy },
    actionName: 'moveSelection',
  });
};

export const moveNodes = (commandHandler: CommandHandler, { dx, dy, nodes }: MoveNodesCommand): void => {
  moveNodesInFlow({
    commandHandler,
    nodes,
    delta: { x: dx, y: dy },
    actionName: 'moveNodes',
  });
};
