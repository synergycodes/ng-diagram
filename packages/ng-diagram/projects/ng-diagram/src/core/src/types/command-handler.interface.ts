import { AddToGroupCommand } from '../command-handler/commands/add-to-group';
import {
  AddEdgeLabelsCommand,
  AddEdgesCommand,
  AddNodesCommand,
  AddPortsBulkCommand,
  AddPortsCommand,
  ClearModelCommand,
  DeleteEdgeLabelsCommand,
  DeleteEdgesCommand,
  DeleteNodesCommand,
  DeletePortsBulkCommand,
  DeletePortsCommand,
  PaletteDropNodeCommand,
  UpdateEdgeCommand,
  UpdateEdgeLabelsCommand,
  UpdateEdgesCommand,
  UpdateNodeCommand,
  UpdateNodesCommand,
  UpdatePortsBulkCommand,
  UpdatePortsCommand,
} from '../command-handler/commands/add-update-delete';
import { CenterOnNodeCommand, CenterOnRectCommand } from '../command-handler/commands/centering';
import { CopyCommand, PasteCommand } from '../command-handler/commands/copy-paste';
import { CutCommand } from '../command-handler/commands/cut';
import { DeleteSelectionCommand } from '../command-handler/commands/delete-selection';
import { HighlightGroupClearCommand, HighlightGroupCommand } from '../command-handler/commands/highlight-group';
import { InitCommand } from '../command-handler/commands/init';
import {
  FinishLinkingCommand,
  FinishLinkingToPositionCommand,
  MoveTemporaryEdgeCommand,
  StartLinkingCommand,
  StartLinkingFromPositionCommand,
} from '../command-handler/commands/linking';
import { MoveNodesByCommand } from '../command-handler/commands/move';
import { MoveNodesStartCommand, MoveNodesStopCommand } from '../command-handler/commands/move-nodes-lifecycle';
import { MoveViewportByCommand, MoveViewportCommand } from '../command-handler/commands/move-viewport';
import { RemoveFromGroupCommand } from '../command-handler/commands/remove-from-group';
import { ResizeNodeCommand } from '../command-handler/commands/resize-node';
import { ResizeNodeStartCommand, ResizeNodeStopCommand } from '../command-handler/commands/resize-node-lifecycle';
import { RotateNodeToCommand } from '../command-handler/commands/rotate-node';
import { RotateNodeStartCommand, RotateNodeStopCommand } from '../command-handler/commands/rotate-node-lifecycle';
import {
  DeselectAllCommand,
  DeselectCommand,
  SelectAllCommand,
  SelectCommand,
} from '../command-handler/commands/selection';
import { BringToFrontCommand, SendToBackCommand } from '../command-handler/commands/z-order';
import { ZoomCommand } from '../command-handler/commands/zoom';
import { ZoomToFitCommand } from '../command-handler/commands/zoom-to-fit';
import { FlowCore } from '../flow-core';

/**
 * Type for system commands that can be emitted by InputEventHandler or user
 */
export type Command =
  | InitCommand
  | SelectCommand
  | SelectAllCommand
  | DeselectCommand
  | DeselectAllCommand
  | MoveNodesByCommand
  | MoveNodesStartCommand
  | MoveNodesStopCommand
  | DeleteSelectionCommand
  | AddNodesCommand
  | UpdateNodeCommand
  | UpdateNodesCommand
  | PaletteDropNodeCommand
  | DeleteNodesCommand
  | AddEdgesCommand
  | UpdateEdgeCommand
  | UpdateEdgesCommand
  | DeleteEdgesCommand
  | CopyCommand
  | CutCommand
  | PasteCommand
  | MoveViewportCommand
  | MoveViewportByCommand
  | StartLinkingCommand
  | MoveTemporaryEdgeCommand
  | FinishLinkingCommand
  | StartLinkingFromPositionCommand
  | FinishLinkingToPositionCommand
  | ResizeNodeCommand
  | ResizeNodeStartCommand
  | ResizeNodeStopCommand
  | ZoomCommand
  | AddPortsCommand
  | AddPortsBulkCommand
  | UpdatePortsCommand
  | UpdatePortsBulkCommand
  | DeletePortsCommand
  | DeletePortsBulkCommand
  | BringToFrontCommand
  | SendToBackCommand
  | AddEdgeLabelsCommand
  | UpdateEdgeLabelsCommand
  | DeleteEdgeLabelsCommand
  | RotateNodeToCommand
  | RotateNodeStartCommand
  | RotateNodeStopCommand
  | HighlightGroupCommand
  | HighlightGroupClearCommand
  | AddToGroupCommand
  | ClearModelCommand
  | RemoveFromGroupCommand
  | CenterOnNodeCommand
  | CenterOnRectCommand
  | ZoomToFitCommand;

/**
 * Type for command name
 */
export type CommandName = Command['name'];

/**
 * Type for command by name
 */
export type CommandByName<N extends CommandName> = Extract<Command, { name: N }>;

/**
 * Type for command without name
 */
export type WithoutName<T> = Omit<T, 'name'>;

/**
 * Type for command without name
 */
export type IsEmpty<T> = keyof WithoutName<T> extends never ? true : false;

/**
 * Type for command callback function
 */
export type CommandCallback<K extends CommandName> = (command: CommandByName<K>) => void;

/**
 * Interface for interpreting and routing system commands
 * This is a core component that handles commands from InputEventHandler or user
 */
export interface CommandHandler {
  readonly flowCore: FlowCore;

  /**
   * Emit a system command
   * @param command Command to emit
   */
  emit<K extends CommandName>(
    commandName: K,
    ...props: IsEmpty<CommandByName<K>> extends true
      ? [] | [WithoutName<CommandByName<K>>]
      : [WithoutName<CommandByName<K>>]
  ): Promise<void>;

  /**
   * Register a callback for specific command types
   * @param commandType Type of command to listen for
   * @param callback Function to be called when command occurs
   */
  register<K extends CommandName>(commandType: K, callback: CommandCallback<K>): void;
}
