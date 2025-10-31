import '@angular/compiler';
import { Component, input, output } from '@angular/core';

export type BackgroundStyle = 'solid' | 'dot' | 'grid' | 'custom';

@Component({
  selector: 'sidebar-container',
  templateUrl: `./sidebar.component.html`,
  styleUrl: './sidebar.component.scss',
})
export class SidebarContainer {
  backgroundStyle = input<BackgroundStyle>();
  backgroundStyleChange = output<BackgroundStyle>();

  onBackgroundStyleChange(style: BackgroundStyle) {
    this.backgroundStyleChange.emit(style);
  }
}
