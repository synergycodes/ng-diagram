import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  Node,
} from 'ng-diagram';

@Component({
  selector: 'app-chip-node',
  imports: [NgDiagramPortComponent, NgDiagramNodeResizeAdornmentComponent],
  templateUrl: './chip-node.component.html',
  styleUrls: ['./chip-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
  host: {
    '[class.ng-diagram-port-hoverable]': 'true',
  },
})
export class ChipNodeComponent implements NgDiagramNodeTemplate<{ text: string }> {
  text = computed(() => this.node()?.data?.text || '');
  node = input.required<Node<{ text: string }>>();
}
