import { type ApplicationConfig, provideZoneChangeDetection } from '@angular/core';

export const harnessAppConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true })],
};
