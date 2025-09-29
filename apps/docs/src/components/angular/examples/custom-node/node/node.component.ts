import { Component, input, model } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

@Component({
  selector: 'node',
  imports: [
    NgDiagramNodeRotateAdornmentComponent,
    NgDiagramPortComponent,
    NgDiagramNodeResizeAdornmentComponent,
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

  selectedState: string = 'Inactive';

  onStateChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedState = selectElement.value;
  }
}
