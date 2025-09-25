import '@angular/compiler';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideNgDiagram } from 'ng-diagram';
import { ReadonlyMiddlewareInnerComponent } from './readonly-middleware-inner.component';

/**
 * Wrapper component that provides the ng-diagram-context
 */
@Component({
  selector: 'readonly-middleware',
  imports: [ReadonlyMiddlewareInnerComponent],
  providers: [provideNgDiagram()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <readonly-middleware-inner /> `,
  styleUrl: './readonly-middleware.component.scss',
})
export class ReadonlyMiddlewareComponent {}
