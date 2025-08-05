import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramNodeTemplate,
  NgDiagramPortComponent,
  Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'app-input-field-node',
  imports: [
    FormsModule,
    NgDiagramPortComponent,
    NgDiagramNodeResizeAdornmentComponent,
    NgDiagramNodeRotateAdornmentComponent,
  ],
  templateUrl: './input-field-node.component.html',
  styleUrls: ['./input-field-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: NgDiagramNodeSelectedDirective, inputs: ['data'] }],
})
export class InputFieldNodeComponent implements NgDiagramNodeTemplate {
  text = model<string>('');
  data = input.required<Node>();
}
