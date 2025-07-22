export abstract class KeyboardAction {
  abstract matches(event: KeyboardEvent): boolean;
  abstract handle(event: KeyboardEvent): void;
}
