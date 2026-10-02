import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  ConnectionValidationContext,
  Edge,
  EdgeDrawEndedEvent,
  EdgeEnd,
  EdgeRelinkEndedEvent,
  EdgeRelinkStartedEvent,
  isEdgeEndRelinkable,
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramService,
  NgDiagramViewportService,
  Node,
  Point,
  Port,
  SelectionRemovedEvent,
} from 'ng-diagram';
import { RelinkingEdgeData } from '../data/relinking-model';

type ValidateConnection = (
  source: Node | null,
  sourcePort: Port | null,
  target: Node | null,
  targetPort: Port | null,
  context?: ConnectionValidationContext
) => boolean;

type ShouldKeepOnDrop = (edge: Edge, dropPosition: Point) => boolean;
type ShouldDetachOnNodeDelete = (edge: Edge, deletedNode: Node, end: EdgeEnd) => boolean;

type KeepOnDropRule = 'always' | 'never' | 'byData';
type DetachOnDeleteRule = 'always' | 'never' | 'byData';
type ValidateRule = 'all' | 'noSelf' | 'sameGroup' | 'noRelink' | 'noAttach';

/** Port every "attach the free end" action connects to. */
const ATTACH_PORT_ID = 'port-left';

/** Oldest entries fall off the event log once it is this long. */
const MAX_LOG_ENTRIES = 30;

const edgeData = (edge: Edge): RelinkingEdgeData => edge.data as RelinkingEdgeData;

const keepOnDropRules: Record<KeepOnDropRule, ShouldKeepOnDrop> = {
  always: () => true,
  never: () => false,
  byData: (edge) => edgeData(edge).keepOnDrop !== false,
};

const detachOnDeleteRules: Record<DetachOnDeleteRule, ShouldDetachOnNodeDelete> = {
  always: () => true,
  never: () => false,
  byData: (edge) => !edgeData(edge).deleteWithNode,
};

const validateRules: Record<ValidateRule, ValidateConnection> = {
  all: () => true,
  noSelf: (source, _sourcePort, target) => source?.id !== target?.id,
  // `source` is null when the other end of the relinked edge is free, so a
  // dangling edge counts as "ungrouped" and only reaches ungrouped nodes.
  sameGroup: (source, _sourcePort, target, _targetPort, context) =>
    context?.reason !== 'relink' || source?.groupId === target?.groupId,
  noRelink: (_source, _sourcePort, _target, _targetPort, context) => context?.reason !== 'relink',
  noAttach: (_source, _sourcePort, _target, _targetPort, context) => context?.reason !== 'attach',
};

/**
 * Test panel for relinking and dangling edges: it drives the whole
 * `linking` / `danglingEdges` configuration live through `updateConfig`,
 * inspects the `relinkable` state of the selected edge, detaches and attaches
 * endpoints through the model service, and logs the relink, draw and removal
 * events the diagram emits.
 */
@Component({
  selector: 'app-relinking-toolbar',
  templateUrl: './relinking-toolbar.component.html',
  styleUrl: './relinking-toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelinkingToolbarComponent implements OnDestroy {
  private readonly ngDiagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);

  exit = output<void>();
  resetScene = output<void>();

  private readonly unsubscribes: (() => void)[] = [];

  constructor() {
    // Setting a new model destroys the diagram core and builds a fresh one
    // from the `[config]` input, which drops both the event listeners and
    // every setting this panel applied. The panel re-applies them on each
    // initialization, so "Reset scene" keeps the log and the settings alive.
    effect(() => {
      if (!this.ngDiagramService.isInitialized()) {
        return;
      }
      untracked(() => {
        this.subscribeToEvents();
        this.applySettings();
      });
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe();
  }

  private subscribeToEvents(): void {
    this.unsubscribe();
    this.unsubscribes.push(
      this.ngDiagramService.addEventListener('edgeRelinkStarted', (event: EdgeRelinkStartedEvent) =>
        this.log(`relinkStarted ${event.edge.id} ${event.end}`)
      ),
      this.ngDiagramService.addEventListener('edgeRelinkEnded', (event: EdgeRelinkEndedEvent) =>
        this.log(this.formatRelinkEnded(event))
      ),
      this.ngDiagramService.addEventListener('edgeDrawEnded', (event: EdgeDrawEndedEvent) =>
        this.log(this.formatDrawEnded(event))
      ),
      this.ngDiagramService.addEventListener('selectionRemoved', (event: SelectionRemovedEvent) =>
        this.log(
          `selectionRemoved nodes=[${ids(event.deletedNodes)}] deleted=[${ids(event.deletedEdges)}] ` +
            `detached=[${ids(event.detachedEdges)}]`
        )
      )
    );
  }

  private unsubscribe(): void {
    this.unsubscribes.forEach((unsubscribe) => unsubscribe());
    this.unsubscribes.length = 0;
  }

  /** Pushes every setting the panel holds into the live config. */
  private applySettings(): void {
    // `updateConfig` deep-merges, so every callback is passed as an explicit
    // function — omitting it would leave the previous one in place.
    this.ngDiagramService.updateConfig({
      linking: {
        defaultRelinkable: this.defaultRelinkable(),
        validateConnection: validateRules[this.validateRule()],
      },
      danglingEdges: {
        enabled: this.danglingEnabled(),
        detachOnNodeDelete: this.detachOnNodeDelete(),
        shouldKeepOnDrop: keepOnDropRules[this.keepOnDropRule()],
        shouldDetachOnNodeDelete: detachOnDeleteRules[this.detachOnDeleteRule()],
      },
    });
  }

  // =============================================
  // Config row
  // =============================================

  // The panel owns every setting it exposes (the initial values match the
  // demo's `[config]` input). A stored callback cannot be read back from the
  // config, and the primitives would be lost on every core rebuild, so the
  // panel is the single source of truth while the mode is open.
  protected readonly defaultRelinkable = signal<boolean | EdgeEnd>(true);
  protected readonly danglingEnabled = signal(true);
  protected readonly detachOnNodeDelete = signal(true);
  protected readonly keepOnDropRule = signal<KeepOnDropRule>('always');
  protected readonly detachOnDeleteRule = signal<DetachOnDeleteRule>('always');
  protected readonly validateRule = signal<ValidateRule>('all');

  protected readonly defaultRelinkableValue = computed(() => String(this.defaultRelinkable()));

  onDefaultRelinkableChange(event: Event): void {
    this.defaultRelinkable.set(parseRelinkable(selectValue(event)));
    this.applySettings();
  }

  onDanglingEnabledChange(): void {
    this.danglingEnabled.update((enabled) => !enabled);
    this.applySettings();
  }

  onDetachOnNodeDeleteChange(): void {
    this.detachOnNodeDelete.update((detach) => !detach);
    this.applySettings();
  }

  onKeepOnDropRuleChange(event: Event): void {
    this.keepOnDropRule.set(selectValue(event) as KeepOnDropRule);
    this.applySettings();
  }

  onDetachOnDeleteRuleChange(event: Event): void {
    this.detachOnDeleteRule.set(selectValue(event) as DetachOnDeleteRule);
    this.applySettings();
  }

  onValidateRuleChange(event: Event): void {
    this.validateRule.set(selectValue(event) as ValidateRule);
    this.applySettings();
  }

  // =============================================
  // Selected edge row
  // =============================================

  protected readonly selectedEdge = computed<Edge | null>(() => this.selectionService.selection().edges[0] ?? null);

  protected readonly selectedNode = computed<Node | null>(() => this.selectionService.selection().nodes[0] ?? null);

  protected readonly endpointsLabel = computed(() => {
    const edge = this.selectedEdge();
    if (!edge) {
      return '';
    }
    return `${edge.source || 'free'} → ${edge.target || 'free'}`;
  });

  protected readonly rawRelinkableLabel = computed(() => {
    const edge = this.selectedEdge();
    if (!edge) {
      return '';
    }
    return edge.relinkable === undefined ? '(default)' : String(edge.relinkable);
  });

  /** What the resolver makes of the edge's own value plus the config default. */
  protected readonly resolvedRelinkableLabel = computed(() => {
    const edge = this.selectedEdge();
    if (!edge) {
      return '';
    }
    const fallback = this.defaultRelinkable();
    const resolve = (end: EdgeEnd) => (isEdgeEndRelinkable(edge, end, fallback) ? 'yes' : 'no');
    return `source: ${resolve('source')} · target: ${resolve('target')}`;
  });

  /** The first endpoint of the selected edge that is not connected to a node. */
  protected readonly freeEnd = computed<EdgeEnd | null>(() => {
    const edge = this.selectedEdge();
    if (!edge) {
      return null;
    }
    if (edge.source === '') {
      return 'source';
    }
    return edge.target === '' ? 'target' : null;
  });

  protected readonly canDetachSource = computed(() => {
    const edge = this.selectedEdge();
    return this.danglingEnabled() && !!edge && edge.source !== '';
  });

  protected readonly canDetachTarget = computed(() => {
    const edge = this.selectedEdge();
    return this.danglingEnabled() && !!edge && edge.target !== '';
  });

  protected readonly canAttachFreeEnd = computed(() => !!this.freeEnd() && !!this.selectedNode());

  setRelinkable(relinkable: boolean | EdgeEnd | undefined): void {
    const edge = this.selectedEdge();
    if (!edge) {
      return;
    }
    // An explicit `undefined` clears the edge's own value, so the resolved
    // state falls back to `linking.defaultRelinkable` again.
    this.modelService.updateEdge(edge.id, { relinkable });
  }

  detach(end: EdgeEnd): void {
    const edge = this.selectedEdge();
    if (!edge) {
      return;
    }
    this.modelService.detachEdge(edge.id, end);
  }

  async attachFreeEnd(): Promise<void> {
    const edge = this.selectedEdge();
    const end = this.freeEnd();
    const node = this.selectedNode();
    if (!edge || !end || !node) {
      return;
    }
    const attached = await this.modelService.attachEdge(edge.id, end, node.id, ATTACH_PORT_ID);
    this.log(`attachEdge → ${attached}`);
  }

  // =============================================
  // Actions row
  // =============================================

  /** Starts a draw gesture from the middle of the screen, with no source node. */
  drawFromCenter(): void {
    const center = this.viewportService.clientToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });
    this.ngDiagramService.startLinkingFromPosition(center);
  }

  zoomToFit(): void {
    this.viewportService.zoomToFit();
  }

  // =============================================
  // Event log
  // =============================================

  protected readonly logEntries = signal<string[]>([]);
  protected readonly maxLogEntries = MAX_LOG_ENTRIES;

  clearLog(): void {
    this.logEntries.set([]);
  }

  private log(entry: string): void {
    this.logEntries.update((entries) => [entry, ...entries].slice(0, MAX_LOG_ENTRIES));
  }

  private formatRelinkEnded(event: EdgeRelinkEndedEvent): string {
    const head = `relinkEnded ${event.edge.id} ${event.end}`;
    if (!event.success) {
      return `${head} ✘ ${event.reason ?? 'reverted'}`;
    }
    if (!event.target) {
      return `${head} ✔ → free`;
    }
    return `${head} ✔ → ${event.target.id}/${event.targetPort ?? 'no port'}`;
  }

  private formatDrawEnded(event: EdgeDrawEndedEvent): string {
    if (!event.success) {
      return `drawEnded ✘ ${event.reason ?? 'cancelled'}`;
    }
    if (!event.target) {
      return 'drawEnded ✔ dangling (no target)';
    }
    return `drawEnded ✔ → ${event.target.id}/${event.targetPort ?? 'no port'}`;
  }
}

const selectValue = (event: Event): string => (event.target as HTMLSelectElement).value;

const parseRelinkable = (value: string): boolean | EdgeEnd => {
  if (value === 'source' || value === 'target') {
    return value;
  }
  return value === 'true';
};

const ids = (parts: { id: string }[]): string => parts.map((part) => part.id).join(', ');
