import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LayoutService } from '../../services/layout/layout.service';

@Component({
  selector: 'angular-adapter-toolbar',
  imports: [CommonModule],
  templateUrl: './angular-adapter-toolbar.html',
  styleUrl: './angular-adapter-toolbar.scss',
})
export class ToolbarComponent {
  private readonly layoutService = inject(LayoutService);

  onTreeLayoutClick(): void {
    this.layoutService.configureTreeLayout();
  }
}
