// snippet: (selectionGestureEnded)="onSelectionDone($event)"
@Component({
  selector: 'app-events-host',
  imports: [NgDiagramComponent],
  template: ` /* @snippet */ `,
})
export class EventsHostComponent {
  readonly model = initializeModel();

  onSelectionDone(event: SelectionGestureEndedEvent): void {}
  onDragEnded(event: NodeDragEndedEvent): void {}
  onEdgeDrawEnded(event: EdgeDrawEndedEvent): void {}
  onViewportChanged(event: ViewportChangedEvent): void {}
}
