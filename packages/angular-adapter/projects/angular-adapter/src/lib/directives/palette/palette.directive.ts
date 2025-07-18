import { Directive, inject, OnInit } from '@angular/core';
import { PaletteService } from '../../services/palette-interaction/palette.service';

@Directive({
  selector: '[angularAdapterPalette]',
  standalone: true,
})
export class NgDiagramPaletteDirective implements OnInit {
  private readonly paletteService = inject(PaletteService);

  ngOnInit(): void {
    this.paletteService.registerDropFromPalette();
  }
}
