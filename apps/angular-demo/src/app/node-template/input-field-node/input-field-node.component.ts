import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  Node,
} from 'ng-diagram';

@Component({
  selector: 'app-input-field-node',
  standalone: true,
  imports: [
    FormsModule,
    NgDiagramPortComponent,
    NgDiagramNodeResizeAdornmentComponent,
    NgDiagramNodeRotateAdornmentComponent,
  ],
  templateUrl: './input-field-node.component.html',
  styleUrls: ['./input-field-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['node'] }],
})
export class InputFieldNodeComponent implements NgDiagramNodeTemplate {
  text = model<string>('');
  node = input.required<Node>();
}
