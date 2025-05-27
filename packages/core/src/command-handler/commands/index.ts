import type { CommandByName, CommandHandler, CommandName } from '../../types';
import {
  addEdgeLabels,
  addEdges,
  addNodes,
  addPorts,
  deleteEdgeLabels,
  deleteEdges,
  deleteNodes,
  deletePorts,
  updateEdge,
  updateEdgeLabel,
  updateNode,
  updatePorts,
} from './add-update-delete';
import { copy, paste } from './copy-paste';
import { deleteSelection } from './delete-selection';
import { init } from './init';
import {
  finishLinking,
  finishLinkingToPosition,
  moveTemporaryEdge,
  startLinking,
  startLinkingFromPosition,
} from './linking';
import { moveSelection } from './move-selection';
import { moveViewport, moveViewportBy } from './move-viewport';
import { resizeNode } from './resize-node';
import { deselect, deselectAll, select } from './selection';
import { bringToFront, sendToBack } from './z-order';
import { zoom } from './zoom';

export type CommandHandlerFunction<K extends CommandName> = (
  commandHandler: CommandHandler,
  command: CommandByName<K>
) => void;

export type CommandMap = {
  [K in CommandName]: CommandHandlerFunction<K>;
};

export const commands: CommandMap = {
  init,
  select,
  deselect,
  deselectAll,
  moveSelection,
  deleteSelection,
  addNodes,
  updateNode,
  deleteNodes,
  addEdges,
  updateEdge,
  deleteEdges,
  copy,
  paste,
  moveViewport,
  moveViewportBy,
  startLinking,
  moveTemporaryEdge,
  finishLinking,
  finishLinkingToPosition,
  startLinkingFromPosition,
  resizeNode,
  zoom,
  addPorts,
  updatePorts,
  deletePorts,
  bringToFront,
  sendToBack,
  addEdgeLabels,
  updateEdgeLabel,
  deleteEdgeLabels,
};
