// snippet: onSelectionDone({ nodes, edges }: SelectionGestureEndedEvent) {
interface SnippetHost {
  viewportTimer?: ReturnType<typeof setTimeout>;
  showToolbar(visible: boolean): void;
  savePositions(positions: { id: string; position: Point }[]): void;
}
