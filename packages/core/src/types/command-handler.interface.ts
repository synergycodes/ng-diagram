import {
  AddEdgesCommand,
  AddNodesCommand,
  DeleteEdgesCommand,
  DeleteNodesCommand,
  UpdateEdgeCommand,
  UpdateNodeCommand,
} from '../commands/add-update-delete';
import { CopyCommand, PasteCommand } from '../commands/copy-paste';
import { DeleteSelectionCommand } from '../commands/delete-selection';
import {
  FinishLinkingCommand,
  FinishLinkingToPositionCommand,
  MoveTemporaryEdgeCommand,
  StartLinkingCommand,
  StartLinkingFromPositionCommand,
} from '../commands/linking';
import { MoveSelectionCommand } from '../commands/move-selection';
import { MoveViewportByCommand, MoveViewportCommand } from '../commands/move-viewport';
import { DeselectAllCommand, SelectCommand } from '../commands/selection';
import { FlowCore } from '../flow-core';
/**
 * Type for system commands that can be emitted by InputEventHandler or user
 */
export type Command =
  | SelectCommand
  | DeselectAllCommand
  | MoveSelectionCommand
  | DeleteSelectionCommand
  | AddNodesCommand
  | UpdateNodeCommand
  | DeleteNodesCommand
  | AddEdgesCommand
  | UpdateEdgeCommand
  | DeleteEdgesCommand
  | CopyCommand
  | PasteCommand
  | MoveViewportCommand
  | MoveViewportByCommand
  | StartLinkingCommand
  | MoveTemporaryEdgeCommand
  | FinishLinkingCommand
  | StartLinkingFromPositionCommand
  | FinishLinkingToPositionCommand;

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
  ): void;

  /**
   * Register a callback for specific command types
   * @param commandType Type of command to listen for
   * @param callback Function to be called when command occurs
   */
  register<K extends CommandName>(commandType: K, callback: CommandCallback<K>): void;
}
