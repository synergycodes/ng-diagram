import 'zone.js';

import { createComponent, provideZoneChangeDetection } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
// Imported as a string and injected on mount: a plain CSS import would make Astro link the
// stylesheet from the page head, so every visitor would download it, also without the diagram.
import globalStyles from './hero-global.css?inline';
import { HeroDiagramComponent } from './hero-diagram.component';

const STYLE_ID = 'landing-hero-diagram-styles';

function injectGlobalStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = globalStyles;
  document.head.append(style);
}

export interface HeroDiagramHandle {
  /** Resolves after the diagram content was fitted to the stage for the first time. */
  readonly fitted: Promise<void>;
  destroy(): void;
}

/** Gives the main thread back to the browser between the expensive bootstrap steps. */
const yieldToMain = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Starts a small Angular application with the hero diagram inside `host`.
 * The diagram canvas covers `host`; its content is fitted into `stage`.
 */
export async function mountHeroDiagram(host: HTMLElement, stage: HTMLElement): Promise<HeroDiagramHandle> {
  injectGlobalStyles();
  const appRef = await createApplication({
    providers: [provideZoneChangeDetection({ eventCoalescing: true })],
  });
  await yieldToMain();

  const componentRef = createComponent(HeroDiagramComponent, {
    environmentInjector: appRef.injector,
  });
  componentRef.setInput('host', host);
  componentRef.setInput('stage', stage);
  const fitted = new Promise<void>((resolve) => {
    const subscription = componentRef.instance.fitted.subscribe(() => {
      subscription.unsubscribe();
      resolve();
    });
  });

  const element = componentRef.location.nativeElement as HTMLElement;
  host.append(element);
  appRef.attachView(componentRef.hostView);
  componentRef.changeDetectorRef.detectChanges();

  return {
    fitted,
    destroy: () => {
      appRef.destroy();
      element.remove();
    },
  };
}
