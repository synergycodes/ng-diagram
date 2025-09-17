import { effect, Injectable, signal } from '@angular/core';
import { type Edge, type Metadata, type Node } from 'ng-diagram';

@Injectable()
export class SaveStateService {
  private KEY = 'ngDiagramSaveStateKey';

  state = signal<string | null>(localStorage.getItem(this.KEY));
  stateSync = effect(() => {
    if (this.state() === null) {
      localStorage.removeItem(this.KEY);
    } else {
      localStorage.setItem(this.KEY, this.state() as string);
    }
  });

  save(newState: string): void {
    this.state.set(newState);
  }

  load(): { nodes: Node[]; edges: Edge[]; metadata: Metadata } | null {
    try {
      const serializedState = this.state();
      return serializedState ? JSON.parse(serializedState) : null;
    } catch (e) {
      console.error('SaveStateService: Error loading state', e);
      return null;
    }
  }

  clear(): void {
    this.state.set(null);
  }
}
