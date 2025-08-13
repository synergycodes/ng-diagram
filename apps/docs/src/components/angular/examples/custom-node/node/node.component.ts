import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgDiagramPortComponent, type NgDiagramNodeTemplate, type Node } from '@angularflow/angular-adapter';

@Component({
  selector: 'node',
  imports: [NgDiagramPortComponent, MatSelectModule, MatFormFieldModule, FormsModule, MatInputModule, MatChipsModule],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss'],
})
export class NodeComponent implements NgDiagramNodeTemplate {
  text = model<string>('');
  data = input.required<Node>();
  node = input.required<Node>();

  selectedState: string = 'Active';
}
