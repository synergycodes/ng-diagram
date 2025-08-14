import '@angular/compiler';

import { Component, computed, inject } from '@angular/core';
import { NgDiagramModelService } from '@angularflow/angular-adapter';

@Component({
  selector: 'sidebar-container',
  template: `<div class="sidebar">
    <div class="vertical">
      <span>Label</span>
      <input [value]="label()" [disabled]="!isEnabled()" (input)="onInput($event.target.value)" />
    </div>
    <div class="horizontal">
      <input
        #isResizableCheckbox
        type="checkbox"
        id="isResizable"
        name="isResizable"
        [checked]="isResizable()"
        [disabled]="!isEnabled()"
        (change)="onIsResizableChange(isResizableCheckbox.checked)"
      />
      <label for="isResizable">Is Resizable</label>
    </div>
    <div class="horizontal">
      <input
        #isRotatableCheckbox
        type="checkbox"
        id="isRotatable"
        name="isRotatable"
        [checked]="isRotatable()"
        [disabled]="!isEnabled()"
        (change)="onIsRotatableChange(isRotatableCheckbox.checked)"
      />
      <label for="isRotatable">Is Rotatable</label>
    </div>
  </div> `,
  styles: `
    :host {
      position: absolute;
      height: 100%;
      padding: 1rem;
      right: 0;

      .sidebar {
        display: flex;
        flex-direction: column;
        background-color: var(--ngd-node-bg-primary-default);
        border: var(--ngd-node-border-size) solid var(--ngd-node-border-color);
        border-radius: var(--ngd-node-border-radius);
        padding: 1rem;
        gap: 0.5rem;
        height: 100%;
        width: 200px;
        user-select: none;

        .horizontal {
          display: flex;
          gap: 0.5rem;
        }

        .vertical {
          display: flex;
          gap: 0.25rem;
          flex-direction: column;
        }
      }
    }
  `,
})
export class SidebarContainer {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly selection = this.modelService.getSelection();
  private readonly selectedNode = computed(() => this.selection().nodes[0]);

  id = computed(() => this.selectedNode().id);
  label = computed(() => this.selectedNode()?.data?.label ?? '');
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
