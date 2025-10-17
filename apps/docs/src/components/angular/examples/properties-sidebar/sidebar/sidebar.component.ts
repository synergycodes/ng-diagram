import '@angular/compiler';
import { Component, computed, inject } from '@angular/core';
import { NgDiagramModelService, NgDiagramSelectionService } from 'ng-diagram';

type Data = {
  label: string;
};

@Component({
  selector: 'sidebar-container',
  templateUrl: `./sidebar.component.html`,
  styleUrl: './sidebar.component.scss',
})
export class SidebarContainer {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly selectedNode = computed(
    () => this.selectionService.selection().nodes[0] ?? null
  );

  id = computed(() => this.selectedNode()?.id ?? null);
  label = computed(() => {
    const data = this.selectedNode()?.data as Data | undefined;
    return data?.label ?? '';
  });
  isRotatable = computed(() => this.selectedNode()?.rotatable ?? false);
  isResizable = computed(() => this.selectedNode()?.resizable ?? false);
  isEnabled = computed(() => !!this.selectedNode());

  onInput(event: Event) {
    if (!this.selectedNode()) return;
    const value = (event.target as HTMLInputElement).value;
    this.modelService.updateNodeData<{ label: string }>(this.id()!, {
      label: value,
    });
  }

  onIsResizableChange(value: boolean) {
    if (!this.selectedNode()) return;
    this.modelService.updateNode(this.id()!, { resizable: value });
  }

  onIsRotatableChange(value: boolean) {
    if (!this.selectedNode()) return;
    this.modelService.updateNode(this.id()!, { rotatable: value });
  }
}
