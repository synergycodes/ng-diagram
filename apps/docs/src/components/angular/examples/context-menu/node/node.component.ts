import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  NgDiagramNodeSelectedDirective,
  NgDiagramPortComponent,
  NgDiagramSelectionService,
  NgDiagramViewportService,
  type NgDiagramNodeTemplate,
  type Node,
} from 'ng-diagram';
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
  private readonly viewportService = inject(NgDiagramViewportService);
  private readonly selectionService = inject(NgDiagramSelectionService);

  text = model<string>('');
  node = input.required<Node>();

  onRightClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (this.node()) {
      // Additionally selects the node on right click
      this.selectionService.select([this.node().id]);

      const cursorPosition = this.viewportService.clientToFlowViewportPosition({
        x: event.clientX,
        y: event.clientY,
      });
      this.contextMenuService.showMenu(cursorPosition);
    }
  }
}
