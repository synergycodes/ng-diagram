import type { CommandByName, CommandHandler, CommandName } from '../../types';
import { addToGroup } from './add-to-group';
import {
  addEdgeLabels,
  addEdges,
  addNodes,
  addPorts,
  clearModel,
  deleteEdgeLabels,
  deleteEdges,
  deleteNodes,
  deletePorts,
  updateEdge,
  updateEdgeLabels,
  updateEdges,
  updateNode,
  updateNodes,
  updatePorts,
} from './add-update-delete';
import { centerOnNode, centerOnRect } from './centering';
import { copy, paste } from './copy-paste';
import { cut } from './cut';
import { deleteSelection } from './delete-selection';
import { highlightGroup, highlightGroupClear } from './highlight-group';
import { init } from './init';
import {
  finishLinking,
  finishLinkingToPosition,
  moveTemporaryEdge,
  startLinking,
  startLinkingFromPosition,
} from './linking/';
import { moveNodesBy } from './move';
import { moveViewport, moveViewportBy } from './move-viewport';
import { removeFromGroup } from './remove-from-group';
import { resizeNode } from './resize-node';
import { rotateNodeTo } from './rotate-node';
import { deselect, deselectAll, select } from './selection';
import { bringToFront, sendToBack } from './z-order';
import { zoom } from './zoom';
import { zoomToFit } from './zoom-to-fit';

export type CommandHandlerFunction<K extends CommandName> = (
  commandHandler: CommandHandler,
  command: CommandByName<K>
) => Promise<void>;

export type CommandMap = {
  [K in CommandName]: CommandHandlerFunction<K>;
};

export const commands: CommandMap = {
  init,
  select,
  deselect,
  deselectAll,
  moveNodesBy,
  deleteSelection,
  addNodes,
  updateNode,
  updateNodes,
  deleteNodes,
  clearModel,
  addEdges,
  updateEdge,
  updateEdges,
  deleteEdges,
  copy,
  cut,
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
  updateEdgeLabels,
  deleteEdgeLabels,
  rotateNodeTo,
  highlightGroup,
  highlightGroupClear,
  addToGroup,
  removeFromGroup,
  centerOnNode,
  centerOnRect,
  zoomToFit,
};
