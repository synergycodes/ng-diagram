import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgDiagramContextComponent } from '@angularflow/angular-adapter';
import { ReadonlyMiddlewareInnerComponent } from './readonly-middleware-inner.component';

/**
 * Wrapper component that provides the ng-diagram-context
 */
@Component({
  selector: 'readonly-middleware',
  imports: [NgDiagramContextComponent, ReadonlyMiddlewareInnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-diagram-context>
      <readonly-middleware-inner />
    </ng-diagram-context>
  `,
  styleUrl: './readonly-middleware.component.scss',
})
export class ReadonlyMiddlewareComponent {}
