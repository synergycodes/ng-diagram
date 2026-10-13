// snippet: protected readonly layoutService = inject(LayoutService);
// From the layout.service.ts block of the skill.
declare class LayoutService {
  layout(fit?: boolean): Promise<void>;
  releaseManualEdges(event: SelectionMovedEvent): void;
}
