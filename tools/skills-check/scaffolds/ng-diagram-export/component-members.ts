// snippet: async exportPng(): Promise<void> {
// From the export service block of the skill.
declare function waitForRender(): Promise<void>;
declare class DiagramExportService {
  png(diagramEl: HTMLElement, fileName?: string): Promise<void>;
}

interface SnippetHost {
  readonly exporter: DiagramExportService;
  readonly model: WritableSignal<ModelAdapter>;
}
