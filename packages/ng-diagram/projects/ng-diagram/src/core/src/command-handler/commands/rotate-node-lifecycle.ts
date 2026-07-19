import type { CommandHandler } from '../../types';

export interface RotateNodeStartCommand {
  name: 'rotateNodeStart';
  /** Id of the node the starting gesture rotates — reported by `nodeRotateStarted`. */
  nodeId?: string;
}

export const rotateNodeStart = async (commandHandler: CommandHandler, command: RotateNodeStartCommand) => {
  await commandHandler.flowCore.applyUpdate(
    command.nodeId ? { gestureNodeIds: [command.nodeId] } : {},
    'rotateNodeStart'
  );
};

export interface RotateNodeStopCommand {
  name: 'rotateNodeStop';
  /** Id of the node the ending gesture rotated — reported by `nodeRotateEnded`. */
  nodeId?: string;
}

export const rotateNodeStop = async (commandHandler: CommandHandler, command: RotateNodeStopCommand) => {
  await commandHandler.flowCore.applyUpdate(
    command.nodeId ? { gestureNodeIds: [command.nodeId] } : {},
    'rotateNodeStop'
  );
};
