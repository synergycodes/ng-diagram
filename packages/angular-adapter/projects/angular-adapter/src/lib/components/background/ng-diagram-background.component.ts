import { AfterContentInit, Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { FlowCoreProviderService } from '../../services';
import { DottedBackgroundComponent } from './default/dotted/dotted-background.component';
import { LogoBackgroundComponent } from './default/logo/logo-background.component';

@Component({
  selector: 'ng-diagram-background',
  templateUrl: './ng-diagram-background.component.html',
  styleUrls: ['./ng-diagram-background.component.scss'],
  imports: [LogoBackgroundComponent, DottedBackgroundComponent],
})
export class NgDiagramBackgroundComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  private scale = computed(() => this.flowCoreProvider.provide().getScale());

  showLogo = computed(() => this.scale() > 1.7);
  hasContent = false;

  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
