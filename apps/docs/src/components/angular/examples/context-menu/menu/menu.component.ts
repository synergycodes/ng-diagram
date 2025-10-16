import { Component, HostListener, inject } from '@angular/core';
import {
  NgDiagramClipboardService,
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramViewportService,
} from 'ng-diagram';
import { ContextMenuService } from './menu.service';

@Component({
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  private contextMenuService = inject(ContextMenuService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly clipboardService = inject(NgDiagramClipboardService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly viewportService = inject(NgDiagramViewportService);

  showMenu = this.contextMenuService.visibility;
  menuPosition = this.contextMenuService.menuPosition;
  nodeContext = this.contextMenuService.nodeContext;

  @HostListener('document:click')
  closeMenu() {
    this.contextMenuService.hideMenu();
  }

  onCopy() {
    this.clipboardService.copy();
  }

  onPaste(event: MouseEvent) {
    const position = this.viewportService.clientToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });
    this.clipboardService.paste(position);
  }

  onDelete() {
    this.selectionService.deleteSelection();
  }

  onSelectAll() {
    const allNodesIds = this.modelService
      .getModel()
      .getNodes()
      .map((node) => node.id);
    this.selectionService.select(allNodesIds);
  }
}
