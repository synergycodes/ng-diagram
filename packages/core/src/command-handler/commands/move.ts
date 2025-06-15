import type { CommandHandler, ModelActionType } from '../../types';
import type { Node } from '../../types/node.interface';
import { snapNumber } from '../../utils/snap-number';

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

const SNAP_GRID = 10;

const moveNodesInFlow = ({ commandHandler, nodes, delta, actionName }: MoveNodesInFlowParams): void => {
  if (nodes.length === 0) {
    return;
  }

  commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate: nodes.map((node) => ({
        id: node.id,
        position: {
          x: snapNumber(node.position.x + delta.x, SNAP_GRID),
          y: snapNumber(node.position.y + delta.y, SNAP_GRID),
        },
      })),
    },
    actionName
  );
};

export const moveSelection = (commandHandler: CommandHandler, { dx, dy }: MoveSelectionCommand): void => {
  const nodesToMove = commandHandler.flowCore.modelLookup.getSelectedNodesWithChildren({ directOnly: false });

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
