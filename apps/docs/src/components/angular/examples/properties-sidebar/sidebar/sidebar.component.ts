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
    () => this.selectionService.selection().nodes[0]
  );

  id = computed(() => this.selectedNode().id);
  label = computed(() => {
    const data = this.selectedNode()?.data as Data;

    return data.label;
  });
  isRotatable = computed(() => this.selectedNode()?.rotatable);
  isResizable = computed(() => this.selectedNode()?.resizable);
  isEnabled = computed(() => !!this.selectedNode());

  onInput(value: string) {
    this.modelService.updateNodeData<{ label: string }>(this.id(), {
      label: value,
    });
  }

  onIsResizableChange(value: boolean) {
    this.modelService.updateNode(this.id(), { resizable: value });
  }

  onIsRotatableChange(value: boolean) {
    this.modelService.updateNode(this.id(), { rotatable: value });
  }
}
