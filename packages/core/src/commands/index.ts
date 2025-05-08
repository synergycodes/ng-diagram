import { CommandByName, CommandHandler, CommandName } from '../types/command-handler.interface';
import { addEdges, addNodes, deleteEdges, deleteNodes, updateEdge, updateNode } from './add-update-delete';
import { copy, paste } from './copy-paste';
import { deleteSelection } from './delete-selection';
import { finishLinking, moveTemporaryEdge, startLinking } from './linking';
import { moveSelection } from './move-selection';
import { moveViewport, moveViewportBy } from './move-viewport';
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
};
