import { Injectable } from '@angular/core';
import { ModelAdapter } from '@angularflow/core';

@Injectable({ providedIn: 'root' })
export class ModelProviderService {
  private model: ModelAdapter | null = null;

  init(model: ModelAdapter): void {
    this.model = model;
  }

  provide(): ModelAdapter {
    if (!this.model) {
      throw new Error('ModelAdapter not initialized');
    }

    return this.model;
  }
}
