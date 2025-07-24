import { Edge } from '../types/edge.interface';
import { Node } from '../types/node.interface';
import { Point } from '../types/utils';

export type InputEventName =
  | 'copy'
  | 'cut'
  | 'paste'
  | 'select'
  | 'deleteSelection'
  | 'panning'
  | 'keyboardPanning'
  | 'pointerMoveSelection'
  | 'keyboardMoveSelection'
  | 'resize'
  | 'zoom'
  | 'linking'
  | 'rotate'
  | 'paletteDrop';

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

export interface InputModifiers {
  primary: boolean; // Ctrl key (Windows/Linux) OR Cmd key (Mac)
  secondary: boolean; // Alt key
  shift: boolean; // Shift key
  meta: boolean; // Windows key OR Cmd key
}
