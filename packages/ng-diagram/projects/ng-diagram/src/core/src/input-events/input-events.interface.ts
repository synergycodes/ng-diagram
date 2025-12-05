import { Edge } from '../types/edge.interface';
import { Node } from '../types/node.interface';
import { Point } from '../types/utils';

export type InputEventName =
  | 'copy'
  | 'cut'
  | 'paste'
  | 'select'
  | 'selectAll'
  | 'deleteSelection'
  | 'panning'
  | 'keyboardPanning'
  | 'pointerMoveSelection'
  | 'keyboardMoveSelection'
  | 'resize'
  | 'zoom'
  | 'linking'
  | 'rotate'
  | 'paletteDrop'
  | 'boxSelection'
  | 'undo'
  | 'redo';

export type InputEventPhase = 'start' | 'continue' | 'end';

export interface BaseInputEvent {
  name: InputEventName;
  id: string;
  timestamp: number;
  modifiers: InputModifiers;
}

export interface BasePointerInputEvent extends BaseInputEvent {
  target: Node | Edge | undefined;
  targetType: 'node' | 'edge' | 'diagram';
  /**
   * The last input point in the client coordinates.
   */
  lastInputPoint: Point;
}

/**
 * Interface representing keyboard and modifier keys state during an input event.
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export interface InputModifiers {
  /**
   * Ctrl key (Windows/Linux) OR Cmd key (Mac)
   */
  primary: boolean;
  /**
   * Alt key
   */
  secondary: boolean;
  /**
   * Shift key
   */
  shift: boolean;
  /**
   * Windows key OR Cmd key
   */
  meta: boolean;
}
