import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  NgDiagramModelService,
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  NgDiagramService,
  type NgDiagramNodeTemplate,
  type Node,
} from '@angularflow/angular-adapter';
import { ContextMenuService } from '../menu/menu.service';

@Component({
  selector: 'node',
  imports: [
    NgDiagramPortComponent,
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
})
export class NodeComponent implements NgDiagramNodeTemplate {
  private readonly contextMenuService = inject(ContextMenuService);
  private readonly diagramService = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);

  text = model<string>('');
  node = input.required<Node>();

  onRightClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.node()) {
      // Additionally selects the node on right click
      this.modelService.setSelection([this.node().id]);

      const cursorPosition = this.diagramService.clientToFlowViewportPosition({
        x: event.clientX,
        y: event.clientY,
      });
      this.contextMenuService.showMenu(cursorPosition);
    }
  }
}
