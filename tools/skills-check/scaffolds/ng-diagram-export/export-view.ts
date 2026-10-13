// snippet: export async function exportView(viewport: NgDiagramViewportService, diagramEl: HTMLElement): Promise<string> {
import { toJpeg } from 'html-to-image';

// From the export service block of the skill.
declare function waitForRender(): Promise<void>;
