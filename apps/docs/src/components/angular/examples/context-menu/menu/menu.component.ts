import { Component, HostListener, inject } from '@angular/core';
import { NgDiagramModelService } from '@angularflow/angular-adapter';
import { ContextMenuService } from './menu.service';

@Component({
  selector: 'menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent {
  private contextMenuService = inject(ContextMenuService);
  private readonly modelService = inject(NgDiagramModelService);

  showMenu = this.contextMenuService.visibility;
  menuPosition = this.contextMenuService.menuPosition;
  nodeContext = this.contextMenuService.nodeContext;

  @HostListener('document:click')
  closeMenu() {
    this.contextMenuService.hideMenu();
  }

  onCopy() {
    this.modelService.copySelection();
  }

  onPaste(event: MouseEvent) {
    const position = this.modelService.clientToFlowPosition({ x: event.clientX, y: event.clientY });
    this.modelService.pasteSelection(position);
  }

  onDelete() {
    this.modelService.deleteSelection();
  }

  onSelectAll() {
    const allNodesIds = this.modelService
      .getModel()
      .getNodes()
      .map((node) => node.id);
    this.modelService.setSelection(allNodesIds);
  }
}
