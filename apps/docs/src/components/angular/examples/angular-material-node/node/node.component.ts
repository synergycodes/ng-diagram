import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  NgDiagramModelService,
  NgDiagramNodeRotateAdornmentComponent,
  NgDiagramNodeSelectedDirective,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';

export type NodeData = {
  name: string;
  status: string;
  description: string;
  tooltip: string;
};

@Component({
  imports: [
    NgDiagramNodeRotateAdornmentComponent,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatChipsModule,
    MatExpansionModule,
  ],
  hostDirectives: [
    { directive: NgDiagramNodeSelectedDirective, inputs: ['node'] },
  ],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
})
export class NodeComponent implements NgDiagramNodeTemplate<NodeData> {
  private readonly modelService = inject(NgDiagramModelService);
  readonly panelOpenState = signal(false);
  node = input.required<Node<NodeData>>();
  nodeStatus = computed(() =>
    this.node().data.status === 'Active'
      ? 'green'
      : this.node().data.status === 'Error'
        ? 'red'
        : 'orange'
  );

  onColorChange({ value }: any) {
    this.modelService.updateNodeData(this.node().id, {
      ...this.node().data,
      status: value,
    });
  }
}
