import { AfterContentInit, Component, computed, ElementRef, inject, viewChild } from '@angular/core';
import { NgDiagramViewportService } from '../../public-services/ng-diagram-viewport.service';
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
  private readonly viewportService = inject(NgDiagramViewportService);

  showLogo = computed(() => this.viewportService.scale() === 2);
  hasContent = false;

  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
