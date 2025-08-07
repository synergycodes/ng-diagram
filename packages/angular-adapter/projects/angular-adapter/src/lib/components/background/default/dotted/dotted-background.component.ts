import { Component } from '@angular/core';
import { BackgroundPatternBase } from '../../background-pattern.base';

@Component({
  selector: 'ng-diagram-dotted-background',
  templateUrl: './dotted-background.component.html',
  styleUrl: './dotted-background.component.scss',
})
export class DottedBackgroundComponent extends BackgroundPatternBase {
  constructor() {
    super();
    this.setupPatternEffect();
  }
}
