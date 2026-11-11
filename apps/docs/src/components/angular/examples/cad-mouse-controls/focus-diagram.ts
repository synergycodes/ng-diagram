// The directives stop the presses they handle, so the diagram does not take focus by itself.
// With focus in the diagram, keyboard shortcuts such as Delete work right after the gesture.
export function focusDiagram(host: HTMLElement): void {
  const diagram = host.querySelector<HTMLElement>('ng-diagram');
  if (diagram && !diagram.contains(document.activeElement)) {
    diagram.focus({ preventScroll: true });
  }
}
