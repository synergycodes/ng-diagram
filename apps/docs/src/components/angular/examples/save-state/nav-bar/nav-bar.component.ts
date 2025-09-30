// @collapse-start
import { Component, computed, inject, output, signal } from '@angular/core';
import { NgDiagramModelService } from 'ng-diagram';
import { SaveStateService } from '../save.service';
// @collapse-end

@Component({
  selector: 'nav-bar',
  // @mark-start
  template: `
    <div class="nav-bar">
      <div class="status">{{ statusMessage() }}</div>
      <button (click)="save()">Save</button>
      <button (click)="load()" [disabled]="!isSaved()">Load</button>
      <button class="clear" (click)="clear()" [disabled]="!isSaved()">
        Clear
      </button>
    </div>
  `,
  // @mark-end
  styleUrls: ['./nav-bar.component.scss'],
})
export class NavBarComponent {
  // @collapse-start
  //TODO - change any type to the correct one
  loadModel = output<any>();

  private readonly saveStateService = inject(SaveStateService);
  private readonly modelService = inject(NgDiagramModelService);
  isSaved = computed(() => {
    return this.saveStateService.state() !== null;
  });

  private statusMessage = signal('');
  private statusTimeout: ReturnType<typeof setTimeout> | null = null;

  save(): void {
    const model = this.modelService.toJSON();
    this.saveStateService.save(model);
    this.showStatus('State has been successfully saved!');
  }

  load(): void {
    const model = this.saveStateService.load();

    if (model) {
      this.loadModel.emit(model);
      this.showStatus('State has been loaded!');
    }
  }

  clear(): void {
    if (window.confirm('Are you sure you want to clear the saved state?')) {
      this.saveStateService.clear();
      this.showStatus('State has been cleared!');
    }
  }

  showStatus(msg: string): void {
    this.statusMessage.set(msg);

    if (this.statusTimeout) {
      clearTimeout(this.statusTimeout);
    }
    this.statusTimeout = setTimeout(() => {
      this.statusMessage.set('');
      this.statusTimeout = null;
    }, 6000);
  }
  // @collapse-end
}
