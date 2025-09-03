import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'node',
  imports: [
    NgDiagramNodeRotateAdornmentComponent,
    NgDiagramPortComponent,
    NgDiagramNodeResizeAdornmentComponent,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatChipsModule,
  ],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  host: {
    '[class.ng-diagram-port-hoverable-over-node]': 'true',
  },
})
export class NodeComponent implements NgDiagramNodeTemplate {
  text = model<string>('');
  node = input.required<Node>();

  selectedState: string = 'Active';
}
