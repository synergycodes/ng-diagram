import { Component } from '@angular/core';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-logo-background',
  templateUrl: './logo-background.component.html',
  styleUrl: './logo-background.component.scss',
})
export class LogoBackgroundComponent extends BackgroundPatternBase {
  constructor() {
    super();
    this.setupPatternEffect();
  }
}
