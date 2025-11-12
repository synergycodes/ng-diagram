import { CommonModule } from '@angular/common';
import { Component, input, model } from '@angular/core';
import {
  NgDiagramNodeResizeAdornmentComponent,
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

type CustomDataType = {
  name: string;
  description: string;
  tooltip: string;
};

@Component({
  imports: [
    NgDiagramNodeRotateAdornmentComponent,
    NgDiagramPortComponent,
    NgDiagramNodeResizeAdornmentComponent,
    CommonModule,
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
export class NodeComponent implements NgDiagramNodeTemplate<CustomDataType> {
  text = model<string>('');
  node = input.required<Node<CustomDataType>>();

  selectedState: string = 'Inactive';

  onStateChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedState = selectElement.value;
  }
}
