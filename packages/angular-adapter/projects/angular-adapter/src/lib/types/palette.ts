import { InputSignal } from '@angular/core';

export interface PaletteNode {
  type: string;
  data: InputSignal<Node>;
}
