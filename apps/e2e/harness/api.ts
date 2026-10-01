import type {
  Model,
  NgDiagramClipboardService,
  NgDiagramConfig,
  NgDiagramGroupsService,
  NgDiagramModelService,
  NgDiagramNodeService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
} from 'ng-diagram';

/**
 * Public surface tests drive the diagram through. Mirrors the public services
 * a real ng-diagram consumer would inject.
 */
export interface DiagramHandle {
  diagram: NgDiagramService;
  model: NgDiagramModelService;
  nodes: NgDiagramNodeService;
  selection: NgDiagramSelectionService;
  viewport: NgDiagramViewportService;
  groups: NgDiagramGroupsService;
  clipboard: NgDiagramClipboardService;
}

/**
 * The contract between Playwright tests and the harness. Tests:
 *   1. Optionally set `__diagramSeed` / `__diagramConfig` / `__diagramTabbable` /
 *      `__diagramOutsideProviderHost` via `addInitScript`.
 *   2. Wait for `__diagramReady` to become `true`.
 *   3. Drive the diagram through `__diagram`.
 */
export interface HarnessBridge {
  __diagramSeed?: Partial<Model>;
  __diagramConfig?: Partial<NgDiagramConfig>;
  /** Renders the palette panel next to the diagram. Off by default so other specs keep a full-viewport canvas. */
  __diagramPalette?: boolean;
  __diagramTabbable?: boolean;
  /** Renders `<ng-diagram>` outside the DOM of the component that declares `provideNgDiagram()`. */
  __diagramOutsideProviderHost?: boolean;
  __diagram?: DiagramHandle;
  __diagramReady?: boolean;
}
