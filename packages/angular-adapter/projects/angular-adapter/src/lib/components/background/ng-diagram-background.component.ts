import { NgIf } from '@angular/common';
import { AfterContentInit, Component, ContentChildren, effect, inject, Input, QueryList, signal } from '@angular/core';
import { FlowCoreProviderService } from '../../services';
import { DottedBackgroundComponent } from './default/dotted/dotted-background.component';
import { LogoBackgroundComponent } from './default/logo/logo-background.component';

@Component({
  selector: 'ng-diagram-background',
  templateUrl: './ng-diagram-background.component.html',
  imports: [NgIf, LogoBackgroundComponent, DottedBackgroundComponent],
})
export class NgDiagramBackgroundComponent implements AfterContentInit {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  @Input() class?: string;
  @Input() style?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ContentChildren('*', { descendants: true }) content!: QueryList<any>;
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
    this.hasContent = this.content.length > 0;
  }
}
