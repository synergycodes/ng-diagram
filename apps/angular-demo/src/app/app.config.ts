import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { NgDiagramModule } from '@angularflow/angular-adapter';
import { FlowConfig } from '@angularflow/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    ...(NgDiagramModule.forRoot({
      zoom: {
        max: 2,
        min: 0.35,
      },
    } as FlowConfig).providers ?? []),
  ],
};
