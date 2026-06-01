import { bootstrapApplication } from '@angular/platform-browser';
import { HarnessComponent } from './harness.component';
import { harnessAppConfig } from './harness.config';

bootstrapApplication(HarnessComponent, harnessAppConfig).catch((err) => console.error(err));
