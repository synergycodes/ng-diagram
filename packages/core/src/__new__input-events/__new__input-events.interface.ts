export type __NEW__InputEventName = 'select';

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

export interface __NEW__InputModifiers {
  primary: boolean; // Ctrl key (Windows/Linux) OR Cmd key (Mac)
  secondary: boolean; // Alt key
  shift: boolean; // Shift key
  meta: boolean; // Windows key OR Cmd key
}
