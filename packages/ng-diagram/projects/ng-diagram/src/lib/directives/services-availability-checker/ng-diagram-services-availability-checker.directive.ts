import { Directive, inject } from '@angular/core';
import { FlowCoreProviderService } from '../../services';

@Directive({
  selector: '[ngDiagramServicesAvailabilityChecker]',
})
export class NgDiagramServicesAvailabilityCheckerDirective {
  private readonly service = inject(FlowCoreProviderService, { optional: true, skipSelf: true });

  constructor() {
    if (!this.service) {
      throw new Error(
        `NgDiagram services are not available. Please register all required services using \`provideNgDiagram()\` in your component's providers array.

Example usage:

import { provideNgDiagram } from 'ng-diagram';

@Component({
  selector: 'app-root',
  providers: [provideNgDiagram()], // Add this to register all ng-diagram services
  template: \`<ng-diagram ...></ng-diagram>\`
})
export class AppComponent {...}`
      );
    }
  }
}
