import type { CommandHandler } from '../../types';

export interface ResizeNodeStartCommand {
  name: 'resizeNodeStart';
  /** Id of the node the starting gesture resizes — reported by `nodeResizeStarted`. */
  nodeId?: string;
}

export const resizeNodeStart = async (commandHandler: CommandHandler, command: ResizeNodeStartCommand) => {
  await commandHandler.flowCore.applyUpdate(
    command.nodeId ? { gestureNodeIds: [command.nodeId] } : {},
    'resizeNodeStart'
  );
};

export interface ResizeNodeStopCommand {
  name: 'resizeNodeStop';
  /** Id of the node the ending gesture resized — reported by `nodeResizeEnded`. */
  nodeId?: string;
}

export const resizeNodeStop = async (commandHandler: CommandHandler, command: ResizeNodeStopCommand) => {
  await commandHandler.flowCore.applyUpdate(
    command.nodeId ? { gestureNodeIds: [command.nodeId] } : {},
    'resizeNodeStop'
  );
};
