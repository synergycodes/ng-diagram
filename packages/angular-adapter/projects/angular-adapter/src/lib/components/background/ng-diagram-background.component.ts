import { NgIf } from '@angular/common';
import { AfterContentInit, Component, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FlowCoreProviderService } from '../../services';
import { DottedBackgroundComponent } from './default/dotted/dotted-background.component';
import { LogoBackgroundComponent } from './default/logo/logo-background.component';

@Component({
  selector: 'ng-diagram-background',
  templateUrl: './ng-diagram-background.component.html',
  styleUrls: ['./ng-diagram-background.component.scss'],
  imports: [NgIf, LogoBackgroundComponent, DottedBackgroundComponent],
})
export class NgDiagramBackgroundComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  hasContent = false;
  showLogo = signal(false);

  constructor() {
    effect(() => {
      const flowCore = this.flowCoreProvider.provide();
      const scale = flowCore.getViewport().scale;
      this.showLogo.set(scale > 1.7);
    });
  }

  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
