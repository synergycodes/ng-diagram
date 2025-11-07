import { Injectable, signal, WritableSignal } from '@angular/core';
import { Rect } from '../../../core/src';

@Injectable({
  providedIn: 'root',
})
export class BoxSelectionProviderService {
  boundingBox: WritableSignal<Rect | null> = signal(null);
}
