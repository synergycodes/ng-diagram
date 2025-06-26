import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FlowCoreProviderService } from '@angularflow/angular-adapter';

@Component({
  selector: 'app-toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
})
export class ToolbarComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  onTreeLayoutClick(): void {
    this.flowCoreProvider.provide().layout('Tree');
  }
}
