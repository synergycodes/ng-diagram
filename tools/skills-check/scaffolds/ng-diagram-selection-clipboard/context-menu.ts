// snippet: openMenu(event: MouseEvent) {
// From references/context-menu.md.
interface MenuState {
  x: number;
  y: number;
  flow: Point;
  onNode: boolean;
}

interface SnippetHost {
  readonly node: InputSignal<Node>;
  readonly menuState: { open(event: MouseEvent, onNode: boolean): void };
  readonly menu: WritableSignal<MenuState | null>;
}
