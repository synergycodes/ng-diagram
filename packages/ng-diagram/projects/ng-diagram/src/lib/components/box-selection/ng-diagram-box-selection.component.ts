import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BoxSelectionProviderService } from '../../services';

@Component({
  selector: 'ng-diagram-box-selection',
  standalone: true,
  templateUrl: './ng-diagram-box-selection.component.html',
  styleUrl: './ng-diagram-box-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgDiagramBoxSelectionComponent {
  readonly boxSelectionProvider = inject(BoxSelectionProviderService);
}
