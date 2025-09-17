import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  createMiddlewares,
  initializeModel,
  NgDiagramComponent,
  NgDiagramService,
  type NgDiagramConfig,
} from '@angularflow/angular-adapter';
import { readOnlyMiddleware } from './read-only-middleware';

/**
 * Inner component that handles the diagram and controls
 */
@Component({
  selector: 'readonly-middleware-inner',
  imports: [NgDiagramComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './readonly-middleware-inner.component.scss',
  template: `
    <div class="controls">
      <button
        [class.active]="isReadOnly()"
        (click)="toggleReadOnly()"
        class="readonly-toggle"
      >
        {{ isReadOnly() ? '🔒 Read-Only Mode' : '✏️ Edit Mode' }}
      </button>
      <div class="status">
        <span [class.readonly]="isReadOnly()">
          {{
            isReadOnly()
              ? 'Diagram is locked - try moving nodes!'
              : 'Diagram is editable - drag nodes around'
          }}
        </span>
      </div>
    </div>
    <div class="diagram">
      <ng-diagram
        [model]="model"
        [config]="config"
        [middlewares]="middlewares"
      />
    </div>
  `,
})
export class ReadonlyMiddlewareInnerComponent {
  private readonly ngDiagram = inject(NgDiagramService);

  isReadOnly = signal(false);

  middlewares = createMiddlewares((defaults) => [
    readOnlyMiddleware,
    ...defaults,
  ]);

  config: NgDiagramConfig & { readOnly: any } = {
    zoom: {
      max: 3,
    },
    readOnly: {
      enabled: false,
      allowedActions: ['changeSelection'],
    },
  };

  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 100, y: 80 },
        size: { width: 120, height: 80 },
        data: { label: 'Node 1' },
        resizable: true,
      },
      {
        id: '2',
        position: { x: 300, y: 80 },
        size: { width: 120, height: 80 },
        data: { label: 'Node 2' },
        resizable: true,
      },
      {
        id: '3',
        position: { x: 200, y: 220 },
        size: { width: 120, height: 80 },
        data: { label: 'Node 3' },
        resizable: true,
      },
    ],
    edges: [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        data: {},
      },
      {
        id: 'e2-3',
        source: '2',
        target: '3',
        data: {},
      },
    ],
    metadata: { viewport: { x: 0, y: 0, scale: 1 } },
  });

  toggleReadOnly() {
    this.isReadOnly.update((current) => {
      const newValue = !current;
      this.ngDiagram.updateConfig({
        readOnly: {
          enabled: newValue,
          allowedActions: ['changeSelection'],
        },
      } as any);
      return newValue;
    });
  }
}
