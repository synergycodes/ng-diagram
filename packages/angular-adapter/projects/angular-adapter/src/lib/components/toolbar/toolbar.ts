import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LayoutService } from '../../services/layout/layout.service';

@Component({
  selector: 'toolbar',
  imports: [CommonModule],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss',
})
export class ToolbarComponent {
  private readonly layoutService = inject(LayoutService);

  onTreeLayoutClick(): void {
    this.layoutService.configureTreeLayout();
  }
}
