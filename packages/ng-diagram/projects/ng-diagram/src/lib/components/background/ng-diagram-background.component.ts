import { AfterContentInit, Component, ElementRef, input, viewChild } from '@angular/core';
import { DottedBackgroundComponent } from './default/dotted/dotted-background.component';
import { NgDiagramGridBackgroundComponent } from './default/grid/grid-background.component';

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
  standalone: true,
  templateUrl: './ng-diagram-background.component.html',
  styleUrls: ['./ng-diagram-background.component.scss'],
  imports: [DottedBackgroundComponent, NgDiagramGridBackgroundComponent],
})
export class NgDiagramBackgroundComponent implements AfterContentInit {
  private readonly custom = viewChild<ElementRef<HTMLElement>>('contentProjection');

  protected hasContent = false;
  isGridBackground = input<boolean>(false);

  /** @internal */
  ngAfterContentInit() {
    this.hasContent = (this.custom()?.nativeElement?.childNodes?.length ?? 0) > 0;
  }
}
