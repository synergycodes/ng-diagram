import { AfterContentInit, Component, ElementRef, viewChild } from '@angular/core';
import { DottedBackgroundComponent } from './default/dotted/dotted-background.component';

/**
 * The `NgDiagramBackgroundComponent` is responsible for rendering the background of the diagram.
 *
 * ## Example usage
 * ```html
 * <ng-diagram ... >
 *   <ng-diagram-background>
 *     <!-- Optional: custom SVG, HTML or IMAGE for background -->
 *   </ng-diagram-background>
 * </ng-diagram>
 * ```
 * @category Components
 */
@Component({
  selector: 'ng-diagram-background',
  templateUrl: './ng-diagram-background.component.html',
  styleUrls: ['./ng-diagram-background.component.scss'],
  imports: [DottedBackgroundComponent],
})
export class NgDiagramBackgroundComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');

  protected hasContent = false;

  /** @internal */
  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
