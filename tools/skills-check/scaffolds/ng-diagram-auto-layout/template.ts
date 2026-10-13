// snippet: <div class="canvas" [class.ready]="ready()">
// From the layout.service.ts block of the skill.
declare class LayoutService {
  layout(fit?: boolean): Promise<void>;
  releaseManualEdges(event: SelectionMovedEvent): void;
}

@Component({
  selector: 'app-layout-host',
  imports: [NgDiagramComponent],
  template: ` /* @snippet */ `,
})
export class LayoutHostComponent {
  readonly model = initializeModel();
  protected readonly layoutService = inject(LayoutService);
  readonly ready = signal(false);

  onInit(): void {}
  onEdgeDrawEnded(event: EdgeDrawEndedEvent): void {}
  onSelectionRemoved(event: SelectionRemovedEvent): void {}
}
