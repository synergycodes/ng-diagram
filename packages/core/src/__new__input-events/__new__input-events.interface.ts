import { Edge } from '../types/edge.interface';
import { Node } from '../types/node.interface';
import { Point } from '../types/utils';

export type __NEW__InputEventName = 'select' | 'panning' | 'pointer-move-selection' | 'resize';

export type __NEW__InputPhase = 'start' | 'continue' | 'end';

export interface __NEW__NEW__BaseInputEvent {
  name: __NEW__InputEventName;
  id: string;
  timestamp: number;
  modifiers: __NEW__InputModifiers;

  // source: InputSource;
  // phase: InteractionPhase;
  // originalEvent: string;
  // target: EventTarget;
  // name: EventType;
}

export interface __NEW__NEW__BasePointerInputEvent extends __NEW__NEW__BaseInputEvent {
  target: Node | Edge | undefined;
  targetType: 'node' | 'edge' | 'diagram';
  lastInputPoint: Point;
}

export interface __NEW__InputModifiers {
  primary: boolean; // Ctrl key (Windows/Linux) OR Cmd key (Mac)
  secondary: boolean; // Alt key
  shift: boolean; // Shift key
  meta: boolean; // Windows key OR Cmd key
}
