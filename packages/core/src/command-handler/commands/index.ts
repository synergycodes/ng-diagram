import type { CommandByName, CommandHandler, CommandName } from '../../types';
import { addEdges, addNodes, deleteEdges, deleteNodes, updateEdge, updateNode } from './add-update-delete';
import { controlNodeSize } from './control-node-size';
import { copy, paste } from './copy-paste';
import { deleteSelection } from './delete-selection';
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
import { deselectAll, select } from './selection';

export type CommandHandlerFunction<K extends CommandName> = (
  commandHandler: CommandHandler,
  command: CommandByName<K>
) => void;

export type CommandMap = {
  [K in CommandName]: CommandHandlerFunction<K>;
};

export const commands: CommandMap = {
  select,
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
  controlNodeSize,
};
